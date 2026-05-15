import type { IncomingMessage } from 'node:http';
import { randomInt, randomUUID } from 'node:crypto';
import { WebSocketServer, type WebSocket } from 'ws';
import { eq } from 'drizzle-orm';
import { db, schema, insertReturningId } from './db';
import {
  boardState,
  getOrCreateGame,
  markQuestionUsed,
  persistPlayerScore,
  persistCurrentQuestion,
  persistFinalJeopardy,
  scoreList,
  teamList,
  setGameStatus,
  currentRoundCategories,
  touchGame,
  removeGame,
  evictIdleGames,
  type ActiveGame,
} from './gameState';
import { verifyHostToken, verifyPlayerToken } from './auth';
import { chooseWinner as selectWinner } from './buzzLogic';

type SocketMeta = {
  socketId: string;
  gameId: string;
  role: 'host' | 'player' | 'presenter';
  hostId?: number;
  playerId?: string;
  /**
   * Best-known round-trip time for this socket (ms). The server keeps the
   * MIN observed RTT — a client cannot help themselves by inflating RTT
   * (would only widen their estimated press time, making them slower).
   */
  minRttMs?: number;
};

/** Fallback one-way latency assumption when no RTT has been observed yet. */
const DEFAULT_ONE_WAY_MS = 60;
/** Buzz collection window — short, just enough to absorb realistic jitter. */
const BUZZ_WINDOW_MS = 250;
/** Hard cap on accepted RTT measurements — anything higher is treated as jitter. */
const MAX_PLAUSIBLE_RTT_MS = 2000;

const sockets = (globalThis as any)._jeoparty_sockets || new Map<string, { ws: WebSocket; meta: SocketMeta }>();
if (process.env.NODE_ENV !== 'production') {
  (globalThis as any)._jeoparty_sockets = sockets;
}
const gameTimers = new Map<string, NodeJS.Timeout[]>();

function trackTimer(gameId: string, timer: NodeJS.Timeout) {
  const list = gameTimers.get(gameId) ?? [];
  list.push(timer);
  gameTimers.set(gameId, list);
}

function clearGameTimers(gameId: string) {
  for (const t of gameTimers.get(gameId) ?? []) clearTimeout(t);
  gameTimers.set(gameId, []);
}

// Schedule removal of a finished game from memory after a grace period
// (long enough for clients to fetch final scores and navigate away).
const GAME_REMOVAL_GRACE_MS = 60_000;
const IDLE_TTL_MS = 2 * 60 * 60 * 1000; // 2h
const IDLE_SWEEP_INTERVAL_MS = 10 * 60 * 1000; // 10 min

function scheduleGameRemoval(gameId: string) {
  setTimeout(() => {
    clearGameTimers(gameId);
    const evicted = removeGame(gameId);
    if (evicted) console.log(`[WS] Evicted finished game ${gameId} from memory`);
  }, GAME_REMOVAL_GRACE_MS);
}

// Single global idle-sweep interval (guarded against double-registration on HMR)
if (!(globalThis as any)._jeoparty_idle_sweep) {
  (globalThis as any)._jeoparty_idle_sweep = setInterval(() => {
    const n = evictIdleGames(IDLE_TTL_MS);
    if (n > 0) console.log(`[WS] Idle sweep evicted ${n} games`);
  }, IDLE_SWEEP_INTERVAL_MS);
}

function send(ws: WebSocket, type: string, payload: Record<string, unknown> = {}) {
  if (ws.readyState === 1) ws.send(JSON.stringify({ type, ...payload }));
}

function broadcast(game: ActiveGame, type: string, payload: Record<string, unknown> = {}) {
  console.log(`[WS] Broadcasting ${type} to game ${game.gameId}`);
  console.log(`[WS] Total connected sockets: ${sockets.size}`);
  let count = 0;
  for (const { ws, meta } of sockets.values()) {
    console.log(`[WS] Checking socket: id=${meta.socketId}, role=${meta.role}, gameId='${meta.gameId}' vs target='${game.gameId}'`);
    if (meta.gameId === game.gameId) {
      console.log(`[WS] Match found! Sending to ${meta.socketId}`);
      send(ws, type, payload);
      count++;
    }
  }
  console.log(`[WS] Broadcast reached ${count} sockets`);
}

function sendToHost(game: ActiveGame, type: string, payload: Record<string, unknown> = {}) {
  if (!game.hostSocketId) return;
  const host = sockets.get(game.hostSocketId);
  if (host) send(host.ws, type, payload);
}

/**
 * Broadcasts the entire current state of the game to all connected clients.
 * This is the ultimate "fix" for any client that gets out of sync.
 */
export async function syncGame(gameId: string) {
  const { refreshGameFromDb, boardState } = await import('./gameState');
  const game = await refreshGameFromDb(gameId);
  if (!game) {
    console.error(`[WS] syncGame: Game not found for ${gameId}`);
    return;
  }
  
  const state = boardState(game);
  console.log(`[WS] syncGame: Broadcasting state for ${gameId}. Players: ${state.scores.length}`);
  broadcast(game, 'SYNC_STATE', state);
}

function findQuestion(game: ActiveGame, questionId: number) {
  for (const cat of currentRoundCategories(game)) {
    const q = cat.questions.find((it) => it.id === questionId);
    if (q) return { category: cat, question: q };
  }
  return null;
}

async function closeQuestion(game: ActiveGame) {
  clearGameTimers(game.gameId);
  if (!game.currentQuestion) return;
  const questionId = game.currentQuestion.questionId;
  game.usedQuestions.add(questionId);
  await markQuestionUsed(game.gameId, questionId);
  game.currentQuestion = null;
  void persistCurrentQuestion(game.gameId, null);
  broadcast(game, 'QUESTION_CLOSED');
  console.log(`[WS] Question closed: ${questionId}`);
  broadcast(game, 'BOARD_STATE', boardState(game));
}

function chooseWinner(game: ActiveGame) {
  const current = game.currentQuestion;
  if (!current) return null;
  return selectWinner(current.buzzOrder, current.eliminated, randomInt);
}

async function resolveBuzzerWinner(gameId: string) {
  const game = await getOrCreateGame(gameId);
  if (!game?.currentQuestion) return;
  const cq = game.currentQuestion;
  if (!cq.buzzerOpen) return;
  const winner = chooseWinner(game);
  if (!winner) {
    cq.buzzerOpen = false;
    await closeQuestion(game);
    return;
  }
  cq.buzzerOpen = false;
  cq.winnerId = winner.playerId;
  void persistCurrentQuestion(game.gameId, cq);
  broadcast(game, 'BUZZER_LOCKED');
  const player = game.players.get(winner.playerId);
  const openAt = cq.serverBuzzerOpenTime ?? winner.clientTime;
  const timeSec = (winner.clientTime - openAt) / 1000;
  broadcast(game, 'BUZZ_WINNER', {
    playerId: winner.playerId,
    displayName: player?.displayName ?? 'Player',
    time: Math.round(timeSec * 1000) / 1000,
  });
}

function openBuzzer(game: ActiveGame) {
  if (!game.currentQuestion) return;
  clearGameTimers(game.gameId);
  const cq = game.currentQuestion;
  cq.buzzerOpen = true;
  cq.serverBuzzerOpenTime = Date.now();
  cq.buzzOrder = [];
  cq.buzzCollectDeadline = null;
  console.log(`[WS] Buzzer opened for game ${game.gameId}`);
  broadcast(game, 'BUZZER_OPEN', { serverTime: cq.serverBuzzerOpenTime });
}

async function judgeAnswer(game: ActiveGame, playerId: string, correct: boolean) {
  const current = game.currentQuestion;
  if (!current) return;
  const player = game.players.get(playerId);
  if (!player) return;
  const delta = correct
    ? current.isDailyDouble ? (current.dailyDoubleWager ?? current.value) : current.value
    : current.isDailyDouble ? -(current.dailyDoubleWager ?? current.value) : -current.value;
  player.score += delta;
  await persistPlayerScore(game.gameId, playerId, player.score);
  broadcast(game, 'QUESTION_RESULT', { playerId, correct, newScore: player.score });
  broadcast(game, 'SCORE_UPDATE', { scores: scoreList(game), teams: teamList(game) });

  if (correct) {
    game.currentPicker = playerId;
    await db.update(schema.games).set({ currentPickerId: playerId }).where(eq(schema.games.id, game.gameId));
    await closeQuestion(game);
    return;
  }

  if (current.isDailyDouble) {
    await closeQuestion(game);
    return;
  }

  current.eliminated.add(playerId);
  void persistCurrentQuestion(game.gameId, current);
  const alive = Array.from(game.players.keys()).filter((id) => !current.eliminated.has(id));
  if (!alive.length) {
    await closeQuestion(game);
  } else {
    openBuzzer(game);
  }
}

function finalJeopardyEligible(game: ActiveGame): string[] {
  // Only players with a positive score participate in Final Jeopardy.
  return Array.from(game.players.entries())
    .filter(([_, p]) => (p.score ?? 0) > 0)
    .map(([id]) => id);
}

async function maybeStartFinalPrompt(game: ActiveGame) {
  if (!game.finalJeopardy) return;
  const eligible = finalJeopardyEligible(game);
  if (!eligible.length) return;
  const allWagered = eligible.every((id) => game.finalJeopardy?.wagers.has(id));
  if (!allWagered) return;
  // All wagers are in — reveal the clue. Players have 30s to answer.
  broadcast(game, 'FINAL_JEOPARDY_START', {
    category: game.board.finalCategory,
    questionText: game.board.finalQuestion,
  });
  const timer = setTimeout(() => {
    if (!game.finalJeopardy) return;
    // Auto-deliver whatever we have to the host for judging
    sendFinalResultsToHost(game);
  }, 30000);
  trackTimer(game.gameId, timer);
}

function sendFinalResultsToHost(game: ActiveGame) {
  if (!game.finalJeopardy) return;
  if (game.finalJeopardy.resultsSent) return;
  game.finalJeopardy.resultsSent = true;
  const eligible = finalJeopardyEligible(game);
  const results = eligible.map((id) => {
    const pl = game.players.get(id)!;
    return {
      playerId: id,
      displayName: pl.displayName,
      wager: game.finalJeopardy?.wagers.get(id) ?? 0,
      answer: game.finalJeopardy?.answers.get(id) ?? '',
    };
  });
  sendToHost(game, 'FINAL_JEOPARDY_REVEAL', {
    category: game.board.finalCategory,
    questionText: game.board.finalQuestion,
    correctAnswer: game.board.finalAnswer,
    results,
  });
}

const INTRO_MS = 26000;

function doGameStart(game: ActiveGame, gameId: string) {
  game.boardReadyAt = Date.now() + INTRO_MS;
  broadcast(game, 'GAME_START', { boardReadyAt: game.boardReadyAt, soundEffects: game.options.soundEffects });
  broadcast(game, 'BOARD_STATE', boardState(game));
  const timer = setTimeout(() => {
    const g = (globalThis as any)._jeoparty_games?.get(gameId) ?? game;
    if (g) g.boardReadyAt = null;
    broadcast(game, 'BOARD_READY');
  }, INTRO_MS);
  trackTimer(gameId, timer);
}

const NAMING_SUGGEST_MS = 25000;
const NAMING_VOTE_MS = 20000;

function startTeamNaming(game: ActiveGame) {
  game.teamNaming = {
    phase: 'suggesting',
    suggestions: new Map(),
    votes: new Map(),
    deadline: Date.now() + NAMING_SUGGEST_MS,
    timer: null,
  };
  const teams = Array.from(game.teams.values()).map((t) => ({
    teamId: t.id,
    teamName: t.name,
    playerIds: t.playerIds,
  }));
  broadcast(game, 'TEAM_NAMING_START', { phase: 'suggesting', teams, deadline: game.teamNaming.deadline });
  const timer = setTimeout(() => {
    if (!game.teamNaming || game.teamNaming.phase !== 'suggesting') return;
    advanceToVoting(game, game.gameId);
  }, NAMING_SUGGEST_MS);
  game.teamNaming.timer = timer;
  trackTimer(game.gameId, timer);
}

function checkAllTeamsSuggested(game: ActiveGame): boolean {
  if (!game.teamNaming) return false;
  for (const [teamId, team] of game.teams) {
    if (!team.playerIds.length) continue;
    const suggestions = game.teamNaming.suggestions.get(teamId);
    if (!suggestions) return false;
    if (!team.playerIds.every((pid) => suggestions.has(pid))) return false;
  }
  return true;
}

function advanceToVoting(game: ActiveGame, gameId: string) {
  if (!game.teamNaming) return;
  if (game.teamNaming.timer) clearTimeout(game.teamNaming.timer);
  // Collect unique suggestions per team
  const teamsWithSuggestions = Array.from(game.teams.values()).map((t) => {
    const sMap = game.teamNaming!.suggestions.get(t.id) ?? new Map<string, string>();
    const unique = [...new Set(Array.from(sMap.values()))];
    return { teamId: t.id, teamName: t.name, suggestions: unique.length ? unique : [t.name], playerIds: t.playerIds };
  });
  game.teamNaming.phase = 'voting';
  game.teamNaming.deadline = Date.now() + NAMING_VOTE_MS;
  broadcast(game, 'TEAM_NAMING_START', { phase: 'voting', teams: teamsWithSuggestions, deadline: game.teamNaming.deadline });
  const timer = setTimeout(() => {
    if (!game.teamNaming || game.teamNaming.phase !== 'voting') return;
    finalizeTeamNames(game, gameId);
  }, NAMING_VOTE_MS);
  game.teamNaming.timer = timer;
  trackTimer(gameId, timer);
}

function checkAllTeamsVoted(game: ActiveGame): boolean {
  if (!game.teamNaming) return false;
  for (const [teamId, team] of game.teams) {
    if (!team.playerIds.length) continue;
    const votes = game.teamNaming.votes.get(teamId);
    if (!votes) return false;
    if (!team.playerIds.every((pid) => votes.has(pid))) return false;
  }
  return true;
}

async function finalizeTeamNames(game: ActiveGame, gameId: string) {
  if (!game.teamNaming) return;
  if (game.teamNaming.timer) clearTimeout(game.teamNaming.timer);
  // Tally votes per team and pick winners
  const results: { teamId: number; name: string }[] = [];
  for (const [teamId, team] of game.teams) {
    const votes = game.teamNaming.votes.get(teamId);
    const suggestions = game.teamNaming.suggestions.get(teamId);
    let winner = team.name;
    if (votes && votes.size > 0) {
      const tally = new Map<string, number>();
      for (const v of votes.values()) tally.set(v, (tally.get(v) ?? 0) + 1);
      const max = Math.max(...tally.values());
      const topVotes = [...tally.entries()].filter(([, c]) => c === max).map(([n]) => n);
      winner = topVotes[Math.floor(Math.random() * topVotes.length)]!;
    } else if (suggestions && suggestions.size > 0) {
      const names = [...suggestions.values()];
      winner = names[Math.floor(Math.random() * names.length)]!;
    }
    team.name = winner;
    results.push({ teamId, name: winner });
    await db.update(schema.teams).set({ name: winner }).where(eq(schema.teams.id, teamId));
  }
  game.teamNaming = null;
  broadcast(game, 'TEAM_NAMES_FINAL', { teams: results });
  // Now start the actual game
  doGameStart(game, gameId);
}

export function initWebSockets(server: import('node:http').Server) {
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url ?? '/', `http://${request.headers.host}`);
    if (url.pathname !== '/ws') return;
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });

  wss.on('connection', async (ws, req: IncomingMessage) => {
    const requestUrl = new URL(req.url ?? '/', `http://${req.headers.host}`);
    const gameIdRaw = requestUrl.searchParams.get('gameId');
    if (!gameIdRaw) return ws.close();
    const gameId = gameIdRaw.toUpperCase().trim();
    const token = requestUrl.searchParams.get('token');

    const game = await getOrCreateGame(gameId);
    if (!game) return ws.close();

    let meta: SocketMeta | null = null;

    if (token) {
      const hostPayload = await verifyHostToken(token);
      if (hostPayload) {
        const rows = await db.select({ hostId: schema.games.hostId })
          .from(schema.games).where(eq(schema.games.id, gameId));
        if (!rows.length || rows[0].hostId !== hostPayload.hostId) return ws.close();
        meta = { socketId: randomUUID(), gameId, role: 'host', hostId: hostPayload.hostId };
        game.hostSocketId = meta.socketId;
      } else {
        const playerPayload = verifyPlayerToken(token);
        if (!playerPayload || playerPayload.gameId !== gameId) return ws.close();
        const player = game.players.get(playerPayload.playerId);
        if (!player) return ws.close();
        meta = { socketId: randomUUID(), gameId, role: 'player', playerId: playerPayload.playerId };
        player.socketId = meta.socketId;
        await db.update(schema.players).set({ socketId: meta.socketId }).where(eq(schema.players.id, playerPayload.playerId));
      }
    } else {
      // No token = presenter (read-only big-screen view)
      meta = { socketId: randomUUID(), gameId, role: 'presenter' };
    }

    sockets.set(meta.socketId, { ws, meta });
    console.log(`[WS] Socket connected: ${meta.socketId} (role: ${meta.role}, gameId: ${meta.gameId})`);
    
    // Immediate full sync for the new connection
    await syncGame(gameId);

    if (meta.role === 'player' && meta.playerId) {
      const p = game.players.get(meta.playerId);
      console.log(`[WS] Broadcasting PLAYER_JOINED for ${p?.displayName || 'Unknown'} (${meta.playerId}) in game ${gameId}`);
      // Notify others of the join specifically, then sync everyone
      broadcast(game, 'PLAYER_JOINED', { 
        playerId: meta.playerId, 
        displayName: p?.displayName ?? 'Player', 
        score: p?.score ?? 0,
        teamId: p?.teamId ?? null 
      });
      await syncGame(gameId);
    }

    ws.on('message', async (raw) => {
      let data: any;
      try { data = JSON.parse(raw.toString()); } catch { return; }
      touchGame(gameId);
      const current = await getOrCreateGame(gameId);
      if (!current) return;

      if (data.type === 'PING') {
        // Track the client's reported RTT (keep the minimum we've seen).
        const reportedRtt = Number(data.rtt);
        if (Number.isFinite(reportedRtt) && reportedRtt >= 0 && reportedRtt < MAX_PLAUSIBLE_RTT_MS) {
          if (meta.minRttMs == null || reportedRtt < meta.minRttMs) {
            meta.minRttMs = reportedRtt;
          }
        }
        const pong: Record<string, unknown> = { serverTime: Date.now() };
        if (data.clientTime != null && typeof data.clientTime === 'number') {
          pong.clientTime = data.clientTime;
        }
        send(ws, 'PONG', pong);
        return;
      }

      // ── HOST MESSAGES ───────────────────────────────────────────────────────
      if (meta.role === 'host') {
        if (data.type === 'GAME_START') {
          // Safety net: if no picker is set yet (e.g., joins happened before
          // we added the first-joiner rule), fall back to the first player.
          if (!current.currentPicker) {
            const first = current.players.keys().next().value ?? null;
            if (first) {
              current.currentPicker = first;
              await db.update(schema.games)
                .set({ currentPickerId: first })
                .where(eq(schema.games.id, gameId));
            }
          }
          await setGameStatus(gameId, 'active');
          current.status = 'active';

          if (current.teamMode && current.teams.size > 0) {
            // Start team naming phase before the intro plays.
            startTeamNaming(current);
          } else {
            doGameStart(current, gameId);
          }
        }

        if (data.type === 'SKIP_TEAM_NAMING' && current.teamNaming) {
          if (current.teamNaming.timer) clearTimeout(current.teamNaming.timer);
          current.teamNaming = null;
          doGameStart(current, gameId);
        }

        if (data.type === 'SKIP_QUESTION') {
          if (!current.currentQuestion) return;
          await closeQuestion(current);
        }

        if (data.type === 'OPEN_QUESTION' && current.status !== 'finished') {
          const questionId = Number(data.questionId);
          if (current.usedQuestions.has(questionId)) return;
          const found = findQuestion(current, questionId);
          if (!found) return;
          const isDD = found.question.isDailyDouble && current.options.dailyDoubles;
          current.currentQuestion = {
            questionId,
            value: found.question.value,
            isDailyDouble: isDD,
            buzzerOpen: false,
            serverBuzzerOpenTime: null,
            buzzCollectDeadline: null,
            buzzOrder: [],
            eliminated: new Set(),
          };
          void persistCurrentQuestion(gameId, current.currentQuestion);
          broadcast(current, 'QUESTION_OPEN', {
            questionId,
            categoryTitle: found.category.title,
            value: found.question.value,
            questionText: found.question.question,
            isDailyDouble: isDD,
          });
          if (!isDD) openBuzzer(current);
        }

        if (data.type === 'JUDGE') {
          await judgeAnswer(current, data.playerId, !!data.correct);
        }

        if (data.type === 'DAILY_DOUBLE_WAGER_ACCEPTED' && current.currentQuestion?.isDailyDouble) {
          current.currentQuestion.dailyDoubleWager = Number(data.wager);
          current.currentQuestion.winnerId = data.playerId as string;
          void persistCurrentQuestion(gameId, current.currentQuestion);
          broadcast(current, 'BUZZ_WINNER', {
            playerId: data.playerId,
            displayName: current.players.get(data.playerId)?.displayName ?? 'Player',
          });
        }

        if (data.type === 'KICK_PLAYER') {
          const playerId = data.playerId as string;
          current.players.delete(playerId);
          await db.delete(schema.players).where(eq(schema.players.id, playerId));
          // If the picker just left, hand the pick to the next remaining player
          if (current.currentPicker === playerId) {
            const next = current.players.keys().next().value ?? null;
            current.currentPicker = next;
            await db.update(schema.games).set({ currentPickerId: next }).where(eq(schema.games.id, gameId));
          }
          broadcast(current, 'PLAYER_KICKED', { playerId });
        }

        if (data.type === 'ADJUST_SCORE') {
          const playerId = data.playerId as string;
          const score = Number(data.score);
          const player = current.players.get(playerId);
          if (!player || Number.isNaN(score)) return;
          player.score = score;
          await persistPlayerScore(gameId, playerId, score);
          broadcast(current, 'SCORE_UPDATE', { scores: scoreList(current), teams: teamList(current) });
        }

        if (data.type === 'SET_TEAM_CONFIG' && current.status === 'lobby') {
          const teamMode = !!data.teamMode;
          const rawN = Number(data.numTeams);
          const numTeams = teamMode ? Math.max(2, Math.min(8, Number.isFinite(rawN) ? Math.floor(rawN) : 2)) : 0;
          current.teamMode = teamMode;
          await db.update(schema.games).set({ teamMode, numTeams }).where(eq(schema.games.id, gameId));
          // Sync teams table to match the new config (only allowed while in lobby).
          const TEAM_NAMES = ['Team A', 'Team B', 'Team C', 'Team D', 'Team E', 'Team F', 'Team G', 'Team H'];
          // Delete current teams (cascade clears team_id on players via reference; we also un-assign in-memory)
          await db.delete(schema.teams).where(eq(schema.teams.gameId, gameId));
          current.teams = new Map();
          for (const p of current.players.values()) p.teamId = null;
          await db.update(schema.players).set({ teamId: null }).where(eq(schema.players.gameId, gameId));
          // Create fresh teams
          for (let i = 0; i < numTeams; i++) {
            const teamId = await insertReturningId(schema.teams, { gameId, name: TEAM_NAMES[i] ?? `Team ${i + 1}`, position: i });
            current.teams.set(teamId, { id: teamId, name: TEAM_NAMES[i] ?? `Team ${i + 1}`, position: i, playerIds: [] });
          }
          broadcast(current, 'SYNC_STATE', boardState(current));
        }

        if (data.type === 'MOVE_PLAYER') {
          const playerId = data.playerId as string;
          const teamId = data.teamId != null ? Number(data.teamId) : null;
          const player = current.players.get(playerId);
          if (!player) return;
          // Remove from old team
          if (player.teamId != null) {
            const oldTeam = current.teams.get(player.teamId);
            if (oldTeam) oldTeam.playerIds = oldTeam.playerIds.filter((id) => id !== playerId);
          }
          player.teamId = teamId;
          // Add to new team
          if (teamId != null) {
            const newTeam = current.teams.get(teamId);
            if (newTeam && !newTeam.playerIds.includes(playerId)) newTeam.playerIds.push(playerId);
          }
          await db.update(schema.players).set({ teamId }).where(eq(schema.players.id, playerId));
          broadcast(current, 'BOARD_STATE', boardState(current));
        }

        if (data.type === 'ADVANCE_ROUND') {
          const nextRound = current.currentRound + 1;
          if (nextRound >= current.board.rounds.length) {
            // All rounds complete — prompt host to start Final Jeopardy.
            sendToHost(current, 'FINAL_JEOPARDY_READY', {});
            return;
          }
          current.currentRound = nextRound;
          await db.update(schema.games).set({ currentRound: nextRound }).where(eq(schema.games.id, gameId));
          broadcast(current, 'ROUND_ADVANCE', {
            roundIndex: nextRound,
            roundTitle: current.board.rounds[nextRound]?.title ?? `Round ${nextRound + 1}`,
          });
          broadcast(current, 'BOARD_STATE', boardState(current));
        }

        if (data.type === 'START_FINAL_JEOPARDY') {
          if (!current.board.finalQuestion?.trim()) {
            sendToHost(current, 'ERROR', { message: 'This board has no Final Jeopardy clue.' });
            return;
          }
          await setGameStatus(gameId, 'final_jeopardy');
          current.status = 'final_jeopardy';
          current.finalJeopardy = {
            wagers: new Map(),
            answers: new Map(),
            judgments: new Map(),
            finalQuestion: current.board.finalQuestion,
            revealed: new Set<string>(),
          };
          void persistFinalJeopardy(gameId, current.finalJeopardy);
          broadcast(current, 'START_FINAL_JEOPARDY', {
            category: current.board.finalCategory,
            eligiblePlayerIds: finalJeopardyEligible(current),
          });
        }

        if (data.type === 'JUDGE_FINAL' && current.finalJeopardy) {
          // Host records a private judgment. Score is applied on REVEAL_FINAL.
          const playerId = data.playerId as string;
          const correct = !!data.correct;
          current.finalJeopardy.judgments.set(playerId, correct);
          void persistFinalJeopardy(gameId, current.finalJeopardy);
          sendToHost(current, 'FINAL_JUDGMENT_ACK', { playerId, correct });
        }

        if (data.type === 'REVEAL_FINAL_RESPONSE' && current.finalJeopardy) {
          const playerId = data.playerId as string;
          if (current.finalJeopardy.revealed.has(playerId)) return;
          current.finalJeopardy.revealed.add(playerId);
          void persistFinalJeopardy(gameId, current.finalJeopardy);
          const judgment = current.finalJeopardy.judgments.get(playerId);
          if (judgment === undefined) return; // host must judge before revealing
          const p = current.players.get(playerId);
          const wager = current.finalJeopardy.wagers.get(playerId) ?? 0;
          if (p) {
            p.score += judgment ? wager : -wager;
            await persistPlayerScore(gameId, playerId, p.score);
          }
          broadcast(current, 'FINAL_RESPONSE_REVEAL', {
            playerId,
            displayName: p?.displayName ?? 'Player',
            answer: current.finalJeopardy.answers.get(playerId) ?? '',
            wager,
            correct: judgment,
            newScore: p?.score ?? 0,
          });
          broadcast(current, 'SCORE_UPDATE', { scores: scoreList(current), teams: teamList(current) });
          const eligible = finalJeopardyEligible(current);
          const allRevealed = eligible.every((id) => current.finalJeopardy?.revealed.has(id));
          if (allRevealed) {
            broadcast(current, 'GAME_OVER', { scores: scoreList(current), teams: teamList(current) });
            await setGameStatus(gameId, 'finished');
            current.status = 'finished';
            scheduleGameRemoval(gameId);
          }
        }

        if (data.type === 'END_GAME') {
          await setGameStatus(gameId, 'finished');
          current.status = 'finished';
          broadcast(current, 'GAME_OVER', { scores: scoreList(current), teams: teamList(current) });
          scheduleGameRemoval(gameId);
        }
      }

      // ── PLAYER MESSAGES ─────────────────────────────────────────────────────
      if (meta.role === 'player' && meta.playerId) {
        if (data.type === 'SELECT_QUESTION') {
          if (current.currentPicker !== meta.playerId || current.status !== 'active' || current.currentQuestion) return;
          // Reject if the intro+board-fill animation hasn't finished yet.
          if (current.boardReadyAt && Date.now() < current.boardReadyAt) return;
          const questionId = Number(data.questionId);
          if (current.usedQuestions.has(questionId)) return;
          const found = findQuestion(current, questionId);
          if (!found) return;
          const isDD = found.question.isDailyDouble && current.options.dailyDoubles;
          current.currentQuestion = {
            questionId,
            value: found.question.value,
            isDailyDouble: isDD,
            buzzerOpen: false,
            serverBuzzerOpenTime: null,
            buzzCollectDeadline: null,
            buzzOrder: [],
            eliminated: new Set(),
          };
          void persistCurrentQuestion(gameId, current.currentQuestion);
          broadcast(current, 'QUESTION_OPEN', {
            questionId,
            categoryTitle: found.category.title,
            value: found.question.value,
            questionText: found.question.question,
            isDailyDouble: isDD,
          });
          if (!isDD) openBuzzer(current);
        }

        if (data.type === 'BUZZ') {
          const cq = current.currentQuestion;
          if (!cq || !cq.buzzerOpen || cq.eliminated.has(meta.playerId)) return;
          // Server-driven timing: the client says "I buzzed now" with NO
          // timestamp. We derive the press time by subtracting our best
          // estimate of one-way latency from the receive time.
          const receiveTime = Date.now();
          const oneWayMs = (meta.minRttMs != null ? meta.minRttMs / 2 : DEFAULT_ONE_WAY_MS);
          const open = cq.serverBuzzerOpenTime ?? 0;
          // Clamp to "no earlier than buzzer open" — prevents both clock skew
          // and the case where one-way RTT happens to be larger than the time
          // since the buzzer actually opened.
          const estimatedPress = Math.max(open, receiveTime - oneWayMs);
          if (cq.buzzOrder.some((b) => b.playerId === meta.playerId)) return;
          if (cq.buzzOrder.length > 0 && cq.buzzCollectDeadline != null && receiveTime > cq.buzzCollectDeadline) return;
          cq.buzzOrder.push({
            playerId: meta.playerId,
            clientTime: estimatedPress,   // semantically: estimated press time
            receivedTime: receiveTime,
          });

          // Short-circuit: if every still-eligible player has buzzed, resolve now.
          const eligibleCount = Array.from(current.players.keys())
            .filter((id) => !cq.eliminated.has(id)).length;
          if (cq.buzzOrder.length >= eligibleCount) {
            void resolveBuzzerWinner(gameId);
            return;
          }

          // Otherwise on the first buzz, schedule a short jitter window for any
          // nearly-simultaneous buzzes that arrived a few ms later.
          if (cq.buzzOrder.length === 1) {
            cq.buzzCollectDeadline = receiveTime + BUZZ_WINDOW_MS;
            const timer = setTimeout(() => void resolveBuzzerWinner(gameId), BUZZ_WINDOW_MS);
            trackTimer(gameId, timer);
          }
        }

        if (data.type === 'DAILY_DOUBLE_WAGER' && current.currentQuestion?.isDailyDouble) {
          // Only the player who picked the Daily Double can wager.
          if (meta.playerId !== current.currentPicker) return;
          const player = current.players.get(meta.playerId);
          if (!player) return;
          // Wager bounds: min $5, max = greater of (current score, highest
          // remaining clue value on the board for the current round).
          const cats = currentRoundCategories(current);
          let highestRemaining = 0;
          for (const cat of cats) {
            for (const q of cat.questions) {
              if (current.usedQuestions.has(q.id)) continue;
              if (q.id === current.currentQuestion.questionId) continue;
              if (q.value > highestRemaining) highestRemaining = q.value;
            }
          }
          const maxWager = Math.max(player.score, highestRemaining);
          const raw = Number(data.wager);
          const wager = Math.max(5, Math.min(maxWager, Number.isFinite(raw) ? Math.floor(raw) : 0));
          current.currentQuestion.dailyDoubleWager = wager;
          current.currentQuestion.winnerId = meta.playerId;
          void persistCurrentQuestion(gameId, current.currentQuestion);
          broadcast(current, 'DAILY_DOUBLE_WAGER', { playerId: meta.playerId, wager });
          // Auto-emit BUZZ_WINNER so the host UI moves into judging mode (no buzzer phase for DD)
          broadcast(current, 'BUZZ_WINNER', {
            playerId: meta.playerId,
            displayName: player.displayName,
          });
        }

        if (data.type === 'FINAL_WAGER' && current.finalJeopardy) {
          const player = current.players.get(meta.playerId);
          if (!player || player.score <= 0) return; // not eligible
          const raw = Math.floor(Number(data.wager));
          if (!Number.isFinite(raw)) return;
          const wager = Math.max(0, Math.min(player.score, raw));
          current.finalJeopardy.wagers.set(meta.playerId, wager);
          void persistFinalJeopardy(gameId, current.finalJeopardy);
          await maybeStartFinalPrompt(current);
        }

        if (data.type === 'FINAL_ANSWER' && current.finalJeopardy) {
          const player = current.players.get(meta.playerId);
          if (!player || player.score <= 0) return;
          current.finalJeopardy.answers.set(meta.playerId, String(data.answer ?? ''));
          void persistFinalJeopardy(gameId, current.finalJeopardy);
          const eligible = finalJeopardyEligible(current);
          const allAnswered = eligible.every((id) => current.finalJeopardy?.answers.has(id));
          if (allAnswered) sendFinalResultsToHost(current);
        }

        if (data.type === 'CHANGE_AVATAR' && current.status === 'lobby') {
          const player = current.players.get(meta.playerId);
          if (!player) return;
          const newColor = Math.max(0, Math.min(5, Number.isFinite(Number(data.avatarColor)) ? Math.floor(Number(data.avatarColor)) : player.avatarColor));
          const newShape = Math.max(0, Math.min(5, Number.isFinite(Number(data.avatarShape)) ? Math.floor(Number(data.avatarShape)) : player.avatarShape));
          // Check uniqueness
          const taken = Array.from(current.players.entries())
            .filter(([id]) => id !== meta.playerId)
            .some(([, p]) => p.avatarColor === newColor && p.avatarShape === newShape);
          if (taken) {
            send(ws, 'AVATAR_TAKEN', {});
            return;
          }
          player.avatarColor = newColor;
          player.avatarShape = newShape;
          await db.update(schema.players).set({ avatarColor: newColor, avatarShape: newShape } as any).where(eq(schema.players.id, meta.playerId));
          broadcast(current, 'BOARD_STATE', boardState(current));
        }

        if (data.type === 'SUGGEST_TEAM_NAME' && current.teamNaming?.phase === 'suggesting') {
          const player = current.players.get(meta.playerId);
          if (!player || player.teamId == null) return;
          const suggestion = String(data.suggestion || '').trim().slice(0, 32);
          if (!suggestion) return;
          let teamSuggestions = current.teamNaming.suggestions.get(player.teamId);
          if (!teamSuggestions) {
            teamSuggestions = new Map();
            current.teamNaming.suggestions.set(player.teamId, teamSuggestions);
          }
          teamSuggestions.set(meta.playerId, suggestion);
          // Check if all players on all teams have suggested — if so advance early
          const allSuggested = checkAllTeamsSuggested(current);
          if (allSuggested) advanceToVoting(current, gameId);
        }

        if (data.type === 'VOTE_TEAM_NAME' && current.teamNaming?.phase === 'voting') {
          const player = current.players.get(meta.playerId);
          if (!player || player.teamId == null) return;
          const vote = String(data.suggestion || '').trim();
          if (!vote) return;
          let teamVotes = current.teamNaming.votes.get(player.teamId);
          if (!teamVotes) {
            teamVotes = new Map();
            current.teamNaming.votes.set(player.teamId, teamVotes);
          }
          teamVotes.set(meta.playerId, vote);
          // Check if all players have voted
          const allVoted = checkAllTeamsVoted(current);
          if (allVoted) finalizeTeamNames(current, gameId);
        }
      }
    });

    ws.on('close', async () => {
      if (!meta) return;
      sockets.delete(meta.socketId);
      const g = await getOrCreateGame(meta.gameId);
      if (!g) return;
      if (meta.role === 'player' && meta.playerId) {
        const p = g.players.get(meta.playerId);
        if (p) p.socketId = '';
      }
      if (meta.role === 'host') g.hostSocketId = '';
    });
  });

  return wss;
}
