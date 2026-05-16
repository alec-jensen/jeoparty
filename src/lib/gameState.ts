import { eq, inArray, and } from 'drizzle-orm';
import { db, schema, isSqlite } from './db';

export interface QuestionData {
  id: number;
  value: number;
  question: string;
  answer: string;
  isDailyDouble: boolean;
  position: number;
}

export interface CategoryData {
  id: number;
  title: string;
  position: number;
  questions: QuestionData[];
}

export interface RoundData {
  id: number;
  title: string;
  position: number;
  categories: CategoryData[];
}

export interface BoardData {
  id: number;
  title: string;
  rounds: RoundData[];
  finalCategory: string;
  finalQuestion: string;
  finalAnswer: string;
}

export interface TeamData {
  id: number;
  name: string;
  position: number;
  playerIds: string[];
}

export interface PlayerData {
  displayName: string;
  score: number;
  socketId: string;
  teamId: number | null;
  avatarColor: number;
  avatarShape: number;
}

export interface ActiveGame {
  gameId: string;
  boardId: number;
  hostSocketId: string;
  status: 'lobby' | 'active' | 'final_jeopardy' | 'finished';
  /** epoch ms of the last socket activity for this game; used for idle TTL eviction */
  lastActivity: number;
  /**
   * Epoch ms when the post-GAME_START intro+board-fill animation completes.
   * Null when not during the intro. Players can't pick clues until this passes.
   */
  boardReadyAt: number | null;
  players: Map<string, PlayerData>;
  teams: Map<number, TeamData>;
  teamMode: boolean;
  options: {
    dailyDoubles: boolean;
    soundEffects: boolean;
    shuffle: boolean;
  };
  board: BoardData;
  usedQuestions: Set<number>;
  currentPicker: string | null;
  currentRound: number;
  currentQuestion: {
    questionId: number;
    value: number;
    isDailyDouble: boolean;
    buzzerOpen: boolean;
    serverBuzzerOpenTime: number | null;
    /** Inclusive deadline (server clock): buzzes accepted while receivedTime <= this after first buzz. */
    buzzCollectDeadline: number | null;
    buzzOrder: { playerId: string; clientTime: number; receivedTime: number }[];
    eliminated: Set<string>;
    dailyDoubleWager?: number;
    winnerId?: string | null;
  } | null;
  finalJeopardy: {
    wagers: Map<string, number>;
    answers: Map<string, string>;
    finalQuestion: string;
    judgments: Map<string, boolean>;
    revealed: Set<string>;
    resultsSent?: boolean;
    /**
     * Host-paced phase of Final Jeopardy:
     *   rules     — rules screen up, host hasn't advanced yet
     *   wagering  — wager inputs open on eligible players
     *   answering — clue revealed, 30s answer timer running
     *   judging   — answers in, host judging
     *   revealing — staggered reveal sequence in progress
     */
    phase: 'rules' | 'wagering' | 'answering' | 'judging' | 'revealing';
  } | null;
  /** Team name suggestion/voting state — only present during naming phase */
  teamNaming: {
    phase: 'suggesting' | 'voting';
    /** teamId → Map<playerId, suggestion> */
    suggestions: Map<number, Map<string, string>>;
    /** teamId → Map<playerId, voted-suggestion> */
    votes: Map<number, Map<string, string>>;
    deadline: number;
    timer: ReturnType<typeof setTimeout> | null;
  } | null;
}

const activeGames = (globalThis as any)._jeoparty_games || new Map<string, ActiveGame>();
if (process.env.NODE_ENV !== 'production') {
  (globalThis as any)._jeoparty_games = activeGames;
}

export async function loadBoard(boardId: number): Promise<BoardData> {
  const boardRows = await db.select({
    id: schema.boards.id,
    title: schema.boards.title,
    finalCategory: schema.boards.finalCategory,
    finalQuestion: schema.boards.finalQuestion,
    finalAnswer: schema.boards.finalAnswer,
  }).from(schema.boards).where(eq(schema.boards.id, boardId));
  if (!boardRows.length) throw new Error('Board not found');

  const baseBoard = {
    id: boardRows[0].id,
    title: boardRows[0].title,
    finalCategory: boardRows[0].finalCategory ?? '',
    finalQuestion: boardRows[0].finalQuestion ?? '',
    finalAnswer: boardRows[0].finalAnswer ?? '',
  };

  const roundRows = await db.select()
    .from(schema.rounds)
    .where(eq(schema.rounds.boardId, boardId))
    .orderBy(schema.rounds.position);

  if (!roundRows.length) {
    return { ...baseBoard, rounds: [] };
  }

  const roundIds = roundRows.map((r) => r.id);
  const categoryRows = await db.select()
    .from(schema.categories)
    .where(inArray(schema.categories.roundId, roundIds))
    .orderBy(schema.categories.position);

  const categoryIds = categoryRows.map((c) => c.id);
  const questionRows = categoryIds.length
    ? await db.select().from(schema.questions)
        .where(inArray(schema.questions.categoryId, categoryIds))
        .orderBy(schema.questions.position)
    : [];

  const questionsByCategory = new Map<number, QuestionData[]>();
  for (const q of questionRows) {
    const list = questionsByCategory.get(q.categoryId) ?? [];
    list.push({ id: q.id, value: q.value, question: q.question, answer: q.answer, isDailyDouble: !!q.isDailyDouble, position: q.position });
    questionsByCategory.set(q.categoryId, list);
  }

  const categoriesByRound = new Map<number, CategoryData[]>();
  for (const c of categoryRows) {
    const list = categoriesByRound.get(c.roundId) ?? [];
    list.push({ id: c.id, title: c.title, position: c.position, questions: questionsByCategory.get(c.id) ?? [] });
    categoriesByRound.set(c.roundId, list);
  }

  return {
    ...baseBoard,
    rounds: roundRows.map((r) => ({
      id: r.id,
      title: r.title,
      position: r.position,
      categories: categoriesByRound.get(r.id) ?? [],
    })),
  };
}

export async function getOrCreateGame(gameId: string): Promise<ActiveGame | null> {
  let active = activeGames.get(gameId);
  
  if (!active) {
    const gameRows = await db.select().from(schema.games).where(eq(schema.games.id, gameId));
    if (!gameRows.length) return null;
    const game = gameRows[0];

    const board = await loadBoard(game.boardId);

    const playerRows = await db.select().from(schema.players).where(eq(schema.players.gameId, gameId));
    const teamRows = await db.select().from(schema.teams).where(eq(schema.teams.gameId, gameId));
    const usedRows = await db.select({ questionId: schema.usedQuestions.questionId })
      .from(schema.usedQuestions).where(eq(schema.usedQuestions.gameId, gameId));

    const teamsMap = new Map<number, TeamData>();
    for (const t of teamRows) {
      teamsMap.set(t.id, { id: t.id, name: t.name, position: t.position, playerIds: [] });
    }

    const playersMap = new Map<string, PlayerData>();
    for (const p of playerRows) {
      playersMap.set(p.id, {
        displayName: p.displayName,
        score: p.score ?? 0,
        socketId: p.socketId ?? '',
        teamId: p.teamId ?? null,
        avatarColor: (p as any).avatarColor ?? 0,
        avatarShape: (p as any).avatarShape ?? 0,
      });
      if (p.teamId != null) {
        teamsMap.get(p.teamId)?.playerIds.push(p.id);
      }
    }

    // Apply shuffle if option is set
    const optShuffle = !!(game as any).optShuffle;
    if (optShuffle) {
      for (const round of board.rounds) {
        for (let i = round.categories.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [round.categories[i], round.categories[j]] = [round.categories[j]!, round.categories[i]!];
        }
      }
    }

    active = {
      gameId,
      boardId: game.boardId,
      hostSocketId: '',
      status: game.status as ActiveGame['status'],
      lastActivity: Date.now(),
      boardReadyAt: null,
      players: playersMap,
      teams: teamsMap,
      teamMode: !!game.teamMode,
      options: {
        dailyDoubles: (game as any).optDailyDoubles !== false,
        soundEffects: (game as any).optSoundEffects !== false,
        shuffle: optShuffle,
      },
      board,
      usedQuestions: new Set(usedRows.map((u) => u.questionId)),
      currentPicker: game.currentPickerId ?? null,
      currentRound: game.currentRound ?? 0,
      currentQuestion: restoreCurrentQuestion(game.currentQuestionJson ?? null),
      finalJeopardy: restoreFinalJeopardy(game.finalJeopardyJson ?? null),
      teamNaming: null,
    };
    activeGames.set(gameId, active);
  } else {
    // Refresh players and teams from DB to handle new joins or score changes outside WS
    console.log(`[GameState] Refreshing players for game ${gameId}`);
    const playerRows = await db.select().from(schema.players).where(eq(schema.players.gameId, gameId));
    console.log(`[GameState] Found ${playerRows.length} players in DB for game ${gameId}`);
    for (const p of playerRows) {
      if (!active.players.has(p.id)) {
        console.log(`[GameState] Adding NEW player ${p.displayName} (${p.id}) to cache`);
        active.players.set(p.id, {
          displayName: p.displayName,
          score: p.score ?? 0,
          socketId: p.socketId ?? '',
          teamId: p.teamId ?? null,
          avatarColor: (p as any).avatarColor ?? 0,
          avatarShape: (p as any).avatarShape ?? 0,
        });
        if (p.teamId != null) {
          const t = active.teams.get(p.teamId);
          if (t && !t.playerIds.includes(p.id)) t.playerIds.push(p.id);
        }
      } else {
        // Update existing player scores/teams in case they changed in DB
        const existing = active.players.get(p.id)!;
        existing.displayName = p.displayName;
        existing.score = p.score ?? 0;
        existing.teamId = p.teamId ?? null;
        existing.avatarColor = (p as any).avatarColor ?? existing.avatarColor ?? 0;
        existing.avatarShape = (p as any).avatarShape ?? existing.avatarShape ?? 0;
      }
    }
  }

  return active;
}

/**
 * Force-refreshes the in-memory game state from the database.
 * Useful for ensuring clients get the absolute latest state on sync.
 */
export async function refreshGameFromDb(gameId: string): Promise<ActiveGame | null> {
  const active = activeGames.get(gameId);
  if (!active) return getOrCreateGame(gameId);

  // Reload players
  const playerRows = await db.select().from(schema.players).where(eq(schema.players.gameId, gameId));
  active.players.clear();
  // Clear team associations first
  for (const t of active.teams.values()) t.playerIds = [];

  for (const p of playerRows) {
    active.players.set(p.id, {
      displayName: p.displayName,
      score: p.score ?? 0,
      socketId: p.socketId ?? '',
      teamId: p.teamId ?? null,
      avatarColor: (p as any).avatarColor ?? 0,
      avatarShape: (p as any).avatarShape ?? 0,
    });
    if (p.teamId != null) {
      const t = active.teams.get(p.teamId);
      if (t) t.playerIds.push(p.id);
    }
  }

  // Reload used questions
  const usedRows = await db.select({ questionId: schema.usedQuestions.questionId })
    .from(schema.usedQuestions).where(eq(schema.usedQuestions.gameId, gameId));
  active.usedQuestions = new Set(usedRows.map(u => u.questionId));

  // Reload game status/round
  const gameRows = await db.select().from(schema.games).where(eq(schema.games.id, gameId));
  if (gameRows.length) {
    active.status = gameRows[0].status as ActiveGame['status'];
    active.currentRound = gameRows[0].currentRound ?? 0;
    active.currentPicker = gameRows[0].currentPickerId ?? null;
  }

  return active;
}

export function getGame(gameId: string) {
  return activeGames.get(gameId);
}

export async function addPlayerToGame(gameId: string, player: { id: string, displayName: string, score?: number, teamId?: number | null, avatarColor?: number, avatarShape?: number }) {
  const g = activeGames.get(gameId);
  if (!g) return;
  g.players.set(player.id, {
    displayName: player.displayName,
    score: player.score ?? 0,
    socketId: '',
    teamId: player.teamId ?? null,
    avatarColor: player.avatarColor ?? 0,
    avatarShape: player.avatarShape ?? 0,
  });
  if (player.teamId != null) {
    const t = g.teams.get(player.teamId);
    if (t && !t.playerIds.includes(player.id)) t.playerIds.push(player.id);
  }
  // First player to join gets the first pick (real Jeopardy starts with the
  // returning champion; here, first joiner stands in for that).
  if (!g.currentPicker) {
    g.currentPicker = player.id;
    await db.update(schema.games)
      .set({ currentPickerId: player.id })
      .where(eq(schema.games.id, gameId));
  }
}

export function getAllGames() {
  return activeGames;
}

export async function setGameStatus(gameId: string, status: ActiveGame['status']) {
  await db.update(schema.games).set({ status }).where(eq(schema.games.id, gameId));
  const g = activeGames.get(gameId);
  if (g) g.status = status;
}

export async function persistPlayerScore(gameId: string, playerId: string, score: number) {
  await db.update(schema.players).set({ score }).where(eq(schema.players.id, playerId));
}

/** Mark a game as active right now (called on every socket message). */
export function touchGame(gameId: string) {
  const g = activeGames.get(gameId);
  if (g) g.lastActivity = Date.now();
}

/** Remove an in-memory game (DB rows persist). */
export function removeGame(gameId: string): boolean {
  return activeGames.delete(gameId);
}

/** Evict in-memory games whose last activity was longer ago than `idleMs`. */
export function evictIdleGames(idleMs: number) {
  const cutoff = Date.now() - idleMs;
  let evicted = 0;
  for (const [id, g] of activeGames) {
    if ((g.lastActivity ?? 0) < cutoff) {
      activeGames.delete(id);
      evicted++;
    }
  }
  return evicted;
}

export async function markQuestionUsed(gameId: string, questionId: number) {
  if (isSqlite()) {
    // SQLite: check-before-insert (safe to call multiple times)
    const existing = await db.select().from(schema.usedQuestions)
      .where(and(eq(schema.usedQuestions.gameId, gameId), eq(schema.usedQuestions.questionId, questionId)));
    if (!existing.length) {
      await db.insert(schema.usedQuestions).values({ gameId, questionId });
    }
  } else {
    // MySQL: use onDuplicateKeyUpdate for efficiency
    await db.insert(schema.usedQuestions).values({ gameId, questionId }).onDuplicateKeyUpdate({ set: { gameId } });
  }
}

export function scoreList(game: ActiveGame) {
  const list = Array.from(game.players.entries()).map(([id, p]) => ({
    playerId: id,
    displayName: p.displayName,
    score: p.score,
    teamId: p.teamId,
    avatarColor: p.avatarColor,
    avatarShape: p.avatarShape,
  }));

  if (!game.teamMode) return list;

  // Build team scores
  const teamScores = new Map<number, number>();
  for (const [, p] of game.players) {
    if (p.teamId != null) {
      teamScores.set(p.teamId, (teamScores.get(p.teamId) ?? 0) + p.score);
    }
  }

  return list.map((p) => ({
    ...p,
    teamScore: p.teamId != null ? (teamScores.get(p.teamId) ?? 0) : undefined,
  }));
}

export function teamList(game: ActiveGame) {
  if (!game.teamMode) return [];
  const teamScores = new Map<number, number>();
  for (const [, p] of game.players) {
    if (p.teamId != null) {
      teamScores.set(p.teamId, (teamScores.get(p.teamId) ?? 0) + p.score);
    }
  }
  return Array.from(game.teams.values()).map((t) => ({
    id: t.id,
    name: t.name,
    position: t.position,
    score: teamScores.get(t.id) ?? 0,
    playerIds: t.playerIds,
  }));
}

/** Serialize currentQuestion to DB (null clears it). Buzzer timing fields are omitted — ephemeral. */
export async function persistCurrentQuestion(gameId: string, cq: ActiveGame['currentQuestion']) {
  const json = cq ? JSON.stringify({
    questionId: cq.questionId,
    value: cq.value,
    isDailyDouble: cq.isDailyDouble,
    dailyDoubleWager: cq.dailyDoubleWager,
    winnerId: cq.winnerId,
    eliminated: Array.from(cq.eliminated),
  }) : null;
  await db.update(schema.games).set({ currentQuestionJson: json } as any).where(eq(schema.games.id, gameId));
}

/** Serialize finalJeopardy to DB (null clears it). */
export async function persistFinalJeopardy(gameId: string, fj: ActiveGame['finalJeopardy']) {
  const json = fj ? JSON.stringify({
    finalQuestion: fj.finalQuestion,
    wagers: Object.fromEntries(fj.wagers),
    answers: Object.fromEntries(fj.answers),
    judgments: Object.fromEntries(fj.judgments),
    revealed: Array.from(fj.revealed),
    phase: fj.phase,
  }) : null;
  await db.update(schema.games).set({ finalJeopardyJson: json } as any).where(eq(schema.games.id, gameId));
}

function restoreCurrentQuestion(json: string | null): ActiveGame['currentQuestion'] {
  if (!json) return null;
  try {
    const d = JSON.parse(json);
    return {
      questionId: d.questionId,
      value: d.value,
      isDailyDouble: !!d.isDailyDouble,
      buzzerOpen: false,
      serverBuzzerOpenTime: null,
      buzzCollectDeadline: null,
      buzzOrder: [],
      eliminated: new Set(d.eliminated ?? []),
      ...(d.dailyDoubleWager != null ? { dailyDoubleWager: d.dailyDoubleWager } : {}),
      ...(d.winnerId !== undefined ? { winnerId: d.winnerId } : {}),
    };
  } catch { return null; }
}

function restoreFinalJeopardy(json: string | null): ActiveGame['finalJeopardy'] {
  if (!json) return null;
  try {
    const d = JSON.parse(json);
    const validPhases: ReadonlyArray<string> = ['rules', 'wagering', 'answering', 'judging', 'revealing'];
    const phase = (validPhases.includes(d.phase) ? d.phase : 'rules') as
      'rules' | 'wagering' | 'answering' | 'judging' | 'revealing';
    return {
      finalQuestion: d.finalQuestion ?? '',
      wagers: new Map(Object.entries(d.wagers ?? {})),
      answers: new Map(Object.entries(d.answers ?? {})),
      judgments: new Map(Object.entries(d.judgments ?? {})),
      revealed: new Set(d.revealed ?? []),
      phase,
    };
  } catch { return null; }
}

export function currentRoundCategories(game: ActiveGame) {
  return game.board.rounds[game.currentRound]?.categories ?? [];
}

export function boardState(game: ActiveGame) {
  let activeQuestion:
    | {
        questionId: number;
        categoryTitle: string;
        value: number;
        questionText: string;
        isDailyDouble: boolean;
        buzzerOpen: boolean;
        winnerId: string | null;
        eliminatedPlayerIds: string[];
        dailyDoubleWager: number | null;
      }
    | null = null;
  let buzzWinner: { playerId: string; displayName: string } | null = null;

  if (game.currentQuestion) {
    const cq = game.currentQuestion;
    for (const cat of currentRoundCategories(game)) {
      const q = cat.questions.find((it) => it.id === cq.questionId);
      if (q) {
        activeQuestion = {
          questionId: cq.questionId,
          categoryTitle: cat.title,
          value: cq.value,
          questionText: q.question,
          isDailyDouble: cq.isDailyDouble,
          buzzerOpen: !!cq.buzzerOpen,
          winnerId: cq.winnerId ?? null,
          eliminatedPlayerIds: Array.from(cq.eliminated),
          dailyDoubleWager: cq.dailyDoubleWager ?? null,
        };
        break;
      }
    }
    if (cq.winnerId) {
      const p = game.players.get(cq.winnerId);
      buzzWinner = { playerId: cq.winnerId, displayName: p?.displayName ?? 'Player' };
    }
  }

  return {
    board: {
      id: game.board.id,
      title: game.board.title,
      categories: currentRoundCategories(game),
    },
    usedQuestions: Array.from(game.usedQuestions.values()),
    scores: scoreList(game),
    teams: teamList(game),
    currentPicker: game.currentPicker,
    currentRound: game.currentRound,
    totalRounds: game.board.rounds.length,
    teamMode: game.teamMode,
    options: game.options,
    boardReadyAt: game.boardReadyAt,
    serverTime: Date.now(),
    status: game.status,
    activeQuestion,
    buzzWinner,
    finalJeopardy: game.finalJeopardy
      ? {
          phase: game.finalJeopardy.phase,
          category: game.board.finalCategory,
          eligiblePlayerIds: Array.from(game.players.entries())
            .filter(([_, p]) => (p.score ?? 0) > 0)
            .map(([id]) => id),
          // Per-player progress so a SYNC_STATE (e.g. another player
          // reconnecting) doesn't re-prompt people who already submitted.
          wageredPlayerIds: Array.from(game.finalJeopardy.wagers.keys()),
          answeredPlayerIds: Array.from(game.finalJeopardy.answers.keys()),
        }
      : null,
  };
}
