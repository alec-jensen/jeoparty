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
}

export interface TeamData {
  id: number;
  name: string;
  position: number;
  playerIds: string[];
}

export interface ActiveGame {
  gameId: string;
  boardId: number;
  hostSocketId: string;
  status: 'lobby' | 'active' | 'final_jeopardy' | 'finished';
  players: Map<string, { displayName: string; score: number; socketId: string; teamId: number | null }>;
  teams: Map<number, TeamData>;
  teamMode: boolean;
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
    buzzOrder: { playerId: string; clientTime: number; receivedTime: number }[];
    eliminated: Set<string>;
    dailyDoubleWager?: number;
  } | null;
  finalJeopardy: {
    wagers: Map<string, number>;
    answers: Map<string, string>;
    finalQuestion: string;
    judgments: Map<string, boolean>;
  } | null;
}

const activeGames = new Map<string, ActiveGame>();

export async function loadBoard(boardId: number): Promise<BoardData> {
  const boardRows = await db.select({ id: schema.boards.id, title: schema.boards.title })
    .from(schema.boards).where(eq(schema.boards.id, boardId));
  if (!boardRows.length) throw new Error('Board not found');

  const roundRows = await db.select()
    .from(schema.rounds)
    .where(eq(schema.rounds.boardId, boardId))
    .orderBy(schema.rounds.position);

  if (!roundRows.length) {
    return { id: boardRows[0].id, title: boardRows[0].title, rounds: [] };
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
    id: boardRows[0].id,
    title: boardRows[0].title,
    rounds: roundRows.map((r) => ({
      id: r.id,
      title: r.title,
      position: r.position,
      categories: categoriesByRound.get(r.id) ?? [],
    })),
  };
}

export async function getOrCreateGame(gameId: string): Promise<ActiveGame | null> {
  const existing = activeGames.get(gameId);
  if (existing) return existing;

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

  const playersMap = new Map<string, { displayName: string; score: number; socketId: string; teamId: number | null }>();
  for (const p of playerRows) {
    playersMap.set(p.id, {
      displayName: p.displayName,
      score: p.score ?? 0,
      socketId: p.socketId ?? '',
      teamId: p.teamId ?? null,
    });
    if (p.teamId != null) {
      teamsMap.get(p.teamId)?.playerIds.push(p.id);
    }
  }

  const active: ActiveGame = {
    gameId,
    boardId: game.boardId,
    hostSocketId: '',
    status: game.status as ActiveGame['status'],
    players: playersMap,
    teams: teamsMap,
    teamMode: !!game.teamMode,
    board,
    usedQuestions: new Set(usedRows.map((u) => u.questionId)),
    currentPicker: game.currentPickerId ?? null,
    currentRound: game.currentRound ?? 0,
    currentQuestion: null,
    finalJeopardy: null,
  };
  activeGames.set(gameId, active);
  return active;
}

export function getGame(gameId: string) {
  return activeGames.get(gameId);
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

export function currentRoundCategories(game: ActiveGame) {
  return game.board.rounds[game.currentRound]?.categories ?? [];
}

export function boardState(game: ActiveGame) {
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
    totalRounds: game.board.rounds.length,
    teamMode: game.teamMode,
    status: game.status,
  };
}
