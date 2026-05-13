import type { IncomingMessage } from 'node:http';
import { randomUUID } from 'node:crypto';
import { WebSocketServer, type WebSocket } from 'ws';
import { query } from '@/lib/db';
import {
  boardState,
  getOrCreateGame,
  markQuestionUsed,
  persistPlayerScore,
  scoreList,
  setGameStatus,
  type ActiveGame
} from '@/lib/gameState';
import { verifyHostToken, verifyPlayerToken } from '@/lib/auth';

type SocketMeta = {
  socketId: string;
  gameId: string;
  role: 'host' | 'player';
  hostId?: number;
  playerId?: string;
};

const sockets = new Map<string, { ws: WebSocket; meta: SocketMeta }>();
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

function send(ws: WebSocket, type: string, payload: Record<string, unknown> = {}) {
  if (ws.readyState === 1) ws.send(JSON.stringify({ type, ...payload }));
}

function broadcast(game: ActiveGame, type: string, payload: Record<string, unknown> = {}) {
  for (const { ws, meta } of sockets.values()) {
    if (meta.gameId === game.gameId) send(ws, type, payload);
  }
}

function findQuestion(game: ActiveGame, questionId: number) {
  for (const cat of game.board.categories) {
    const q = cat.questions.find((it) => it.id === questionId);
    if (q) return { category: cat, question: q };
  }
  return null;
}

async function closeQuestion(game: ActiveGame) {
  if (!game.currentQuestion) return;
  const questionId = game.currentQuestion.questionId;
  game.usedQuestions.add(questionId);
  await markQuestionUsed(game.gameId, questionId);
  game.currentQuestion = null;
  broadcast(game, 'QUESTION_CLOSED');
  broadcast(game, 'BOARD_STATE', boardState(game));
}

function chooseWinner(game: ActiveGame) {
  const current = game.currentQuestion;
  if (!current) return null;
  const eligible = current.buzzOrder
    .filter((buzz) => !current.eliminated.has(buzz.playerId))
    .sort((a, b) => a.clientTime - b.clientTime || a.receivedTime - b.receivedTime);
  return eligible[0] ?? null;
}

function openBuzzer(game: ActiveGame, windowMs = 5000) {
  if (!game.currentQuestion) return;
  clearGameTimers(game.gameId);
  game.currentQuestion.buzzerOpen = true;
  game.currentQuestion.serverBuzzerOpenTime = Date.now();
  broadcast(game, 'BUZZER_OPEN', { serverTime: game.currentQuestion.serverBuzzerOpenTime, windowMs });

  const timer = setTimeout(async () => {
    if (!game.currentQuestion || !game.currentQuestion.buzzerOpen) return;
    const winner = chooseWinner(game);
    if (!winner) {
      game.currentQuestion.buzzerOpen = false;
      await closeQuestion(game);
      return;
    }
    game.currentQuestion.buzzerOpen = false;
    broadcast(game, 'BUZZER_LOCKED');
    const player = game.players.get(winner.playerId);
    broadcast(game, 'BUZZ_WINNER', { playerId: winner.playerId, displayName: player?.displayName ?? 'Player' });
  }, windowMs + 30);
  trackTimer(game.gameId, timer);
}

async function judgeAnswer(game: ActiveGame, playerId: string, correct: boolean) {
  const current = game.currentQuestion;
  if (!current) return;
  const player = game.players.get(playerId);
  if (!player) return;
  const delta = correct
    ? current.isDailyDouble
      ? current.dailyDoubleWager ?? current.value
      : current.value
    : current.isDailyDouble
    ? -(current.dailyDoubleWager ?? current.value)
    : -current.value;
  player.score += delta;
  await persistPlayerScore(game.gameId, playerId, player.score);
  broadcast(game, 'QUESTION_RESULT', { playerId, correct, newScore: player.score });
  broadcast(game, 'SCORE_UPDATE', { scores: scoreList(game) });

  if (correct) {
    game.currentPicker = playerId;
    await query('UPDATE games SET current_picker_id = ? WHERE id = ?', [playerId, game.gameId]);
    await closeQuestion(game);
    return;
  }

  if (current.isDailyDouble) {
    await closeQuestion(game);
    return;
  }

  current.eliminated.add(playerId);
  const alive = Array.from(game.players.keys()).filter((id) => !current.eliminated.has(id));
  if (!alive.length) {
    await closeQuestion(game);
  } else {
    openBuzzer(game);
  }
}

function pickFinalQuestion(game: ActiveGame) {
  for (const cat of game.board.categories) {
    for (const q of cat.questions) {
      if (!game.usedQuestions.has(q.id)) return q.question;
    }
  }
  return 'Final Jeopardy: The game is about to end!';
}

async function maybeStartFinalPrompt(game: ActiveGame) {
  if (!game.finalJeopardy) return;
  const allPlayers = Array.from(game.players.keys());
  const complete = allPlayers.every((id) => game.finalJeopardy?.wagers.has(id));
  if (!complete) return;
  broadcast(game, 'FINAL_JEOPARDY_START', { questionText: game.finalJeopardy.finalQuestion });
  const timer = setTimeout(() => {
    if (!game.finalJeopardy) return;
    broadcast(game, 'FINAL_JEOPARDY_END', { results: [] });
  }, 30000);
  trackTimer(game.gameId, timer);
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
    const gameId = requestUrl.searchParams.get('gameId');
    const token = requestUrl.searchParams.get('token');
    if (!gameId || !token) return ws.close();

    const game = await getOrCreateGame(gameId);
    if (!game) return ws.close();

    let meta: SocketMeta | null = null;
    const hostPayload = await verifyHostToken(token);
    if (hostPayload) {
      const rows = await query<any[]>('SELECT host_id FROM games WHERE id = ?', [gameId]);
      if (!rows.length || rows[0].host_id !== hostPayload.hostId) return ws.close();
      meta = { socketId: randomUUID(), gameId, role: 'host', hostId: hostPayload.hostId };
      game.hostSocketId = meta.socketId;
    } else {
      const playerPayload = verifyPlayerToken(token);
      if (!playerPayload || playerPayload.gameId !== gameId) return ws.close();
      const player = game.players.get(playerPayload.playerId);
      if (!player) return ws.close();
      meta = { socketId: randomUUID(), gameId, role: 'player', playerId: playerPayload.playerId };
      player.socketId = meta.socketId;
      await query('UPDATE players SET socket_id = ? WHERE id = ?', [meta.socketId, playerPayload.playerId]);
    }

    sockets.set(meta.socketId, { ws, meta });
    send(ws, 'BOARD_STATE', boardState(game));
    if (meta.role === 'player' && meta.playerId) {
      const p = game.players.get(meta.playerId);
      broadcast(game, 'PLAYER_JOINED', { playerId: meta.playerId, displayName: p?.displayName ?? 'Player' });
    }

    ws.on('message', async (raw) => {
      let data: any;
      try {
        data = JSON.parse(raw.toString());
      } catch {
        return;
      }
      const current = await getOrCreateGame(gameId);
      if (!current) return;

      if (data.type === 'PING') {
        send(ws, 'PONG', { serverTime: Date.now() });
        return;
      }

      if (meta.role === 'host') {
        if (data.type === 'GAME_START') {
          await setGameStatus(gameId, 'active');
          current.status = 'active';
          broadcast(current, 'GAME_START');
          broadcast(current, 'BOARD_STATE', boardState(current));
        }

        if (data.type === 'OPEN_QUESTION' && current.status !== 'finished') {
          const questionId = Number(data.questionId);
          if (current.usedQuestions.has(questionId)) return;
          const found = findQuestion(current, questionId);
          if (!found) return;
          current.currentQuestion = {
            questionId,
            value: found.question.value,
            isDailyDouble: found.question.isDailyDouble,
            buzzerOpen: false,
            serverBuzzerOpenTime: null,
            buzzOrder: [],
            eliminated: new Set()
          };
          broadcast(current, 'QUESTION_OPEN', {
            questionId,
            categoryTitle: found.category.title,
            value: found.question.value,
            questionText: found.question.question,
            isDailyDouble: found.question.isDailyDouble
          });
          if (!found.question.isDailyDouble) openBuzzer(current);
        }

        if (data.type === 'JUDGE') {
          await judgeAnswer(current, data.playerId, !!data.correct);
        }

        if (data.type === 'DAILY_DOUBLE_WAGER_ACCEPTED' && current.currentQuestion?.isDailyDouble) {
          current.currentQuestion.dailyDoubleWager = Number(data.wager);
          broadcast(current, 'BUZZ_WINNER', {
            playerId: data.playerId,
            displayName: current.players.get(data.playerId)?.displayName ?? 'Player'
          });
        }

        if (data.type === 'KICK_PLAYER') {
          const playerId = data.playerId as string;
          current.players.delete(playerId);
          await query('DELETE FROM players WHERE id = ? AND game_id = ?', [playerId, gameId]);
          broadcast(current, 'PLAYER_KICKED', { playerId });
        }

        if (data.type === 'ADJUST_SCORE') {
          const playerId = data.playerId as string;
          const score = Number(data.score);
          const player = current.players.get(playerId);
          if (!player || Number.isNaN(score)) return;
          player.score = score;
          await persistPlayerScore(gameId, playerId, score);
          broadcast(current, 'SCORE_UPDATE', { scores: scoreList(current) });
        }

        if (data.type === 'START_FINAL_JEOPARDY') {
          await setGameStatus(gameId, 'final_jeopardy');
          current.status = 'final_jeopardy';
          broadcast(current, 'START_FINAL_JEOPARDY');
          current.finalJeopardy = {
            wagers: new Map(),
            answers: new Map(),
            judgments: new Map(),
            finalQuestion: pickFinalQuestion(current)
          };
          const timer = setTimeout(async () => {
            await maybeStartFinalPrompt(current);
          }, 60000);
          trackTimer(gameId, timer);
        }

        if (data.type === 'JUDGE_FINAL' && current.finalJeopardy) {
          const playerId = data.playerId as string;
          const correct = !!data.correct;
          current.finalJeopardy.judgments.set(playerId, correct);
          const p = current.players.get(playerId);
          const wager = current.finalJeopardy.wagers.get(playerId) ?? 0;
          if (p) {
            p.score += correct ? wager : -wager;
            await persistPlayerScore(gameId, playerId, p.score);
          }
          const allJudged = Array.from(current.players.keys()).every((id) => current.finalJeopardy?.judgments.has(id));
          if (allJudged) {
            const results = Array.from(current.players.entries()).map(([id, pl]) => ({
              playerId: id,
              displayName: pl.displayName,
              wager: current.finalJeopardy?.wagers.get(id) ?? 0,
              answer: current.finalJeopardy?.answers.get(id) ?? '',
              correct: current.finalJeopardy?.judgments.get(id) ?? false,
              newScore: pl.score
            }));
            broadcast(current, 'FINAL_JEOPARDY_END', { results });
            broadcast(current, 'GAME_OVER', { scores: scoreList(current) });
            await setGameStatus(gameId, 'finished');
            current.status = 'finished';
          }
        }

        if (data.type === 'END_GAME') {
          await setGameStatus(gameId, 'finished');
          current.status = 'finished';
          broadcast(current, 'GAME_OVER', { scores: scoreList(current) });
        }
      }

      if (meta.role === 'player' && meta.playerId) {
        if (data.type === 'SELECT_QUESTION') {
          if (current.currentPicker !== meta.playerId || current.status !== 'active' || current.currentQuestion) return;
          const questionId = Number(data.questionId);
          if (current.usedQuestions.has(questionId)) return;
          const found = findQuestion(current, questionId);
          if (!found) return;
          current.currentQuestion = {
            questionId,
            value: found.question.value,
            isDailyDouble: found.question.isDailyDouble,
            buzzerOpen: false,
            serverBuzzerOpenTime: null,
            buzzOrder: [],
            eliminated: new Set()
          };
          broadcast(current, 'QUESTION_OPEN', {
            questionId,
            categoryTitle: found.category.title,
            value: found.question.value,
            questionText: found.question.question,
            isDailyDouble: found.question.isDailyDouble
          });
          if (!found.question.isDailyDouble) openBuzzer(current);
        }

        if (data.type === 'BUZZ') {
          const cq = current.currentQuestion;
          if (!cq || !cq.buzzerOpen || cq.eliminated.has(meta.playerId)) return;
          const t = Number(data.clientTime);
          const open = cq.serverBuzzerOpenTime ?? 0;
          if (t < open || t > open + 5000) return;
          if (cq.buzzOrder.some((b) => b.playerId === meta.playerId)) return;
          cq.buzzOrder.push({ playerId: meta.playerId, clientTime: t, receivedTime: Date.now() });
        }

        if (data.type === 'DAILY_DOUBLE_WAGER' && current.currentQuestion?.isDailyDouble) {
          current.currentQuestion.dailyDoubleWager = Number(data.wager);
          broadcast(current, 'DAILY_DOUBLE_WAGER', { playerId: meta.playerId, wager: Number(data.wager) });
        }

        if (data.type === 'FINAL_WAGER' && current.finalJeopardy) {
          current.finalJeopardy.wagers.set(meta.playerId, Math.max(0, Number(data.wager) || 0));
          await maybeStartFinalPrompt(current);
        }

        if (data.type === 'FINAL_ANSWER' && current.finalJeopardy) {
          current.finalJeopardy.answers.set(meta.playerId, String(data.answer ?? ''));
          const allAnswered = Array.from(current.players.keys()).every((id) => current.finalJeopardy?.answers.has(id));
          if (allAnswered) {
            broadcast(current, 'FINAL_JEOPARDY_END', { results: [] });
          }
        }
      }
    });

    ws.on('close', async () => {
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
