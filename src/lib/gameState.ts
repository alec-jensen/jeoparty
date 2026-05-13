import { query } from '@/lib/db';

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

export interface BoardData {
  id: number;
  title: string;
  categories: CategoryData[];
}

export interface ActiveGame {
  gameId: string;
  boardId: number;
  hostSocketId: string;
  status: 'lobby' | 'active' | 'final_jeopardy' | 'finished';
  players: Map<string, { displayName: string; score: number; socketId: string }>;
  board: BoardData;
  usedQuestions: Set<number>;
  currentPicker: string | null;
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
  const boardRows = await query<any[]>('SELECT id, title FROM boards WHERE id = ?', [boardId]);
  if (!boardRows.length) throw new Error('Board not found');
  const categoryRows = await query<any[]>('SELECT id, title, position FROM categories WHERE board_id = ? ORDER BY position ASC', [boardId]);
  const questionRows = await query<any[]>(
    'SELECT id, category_id, value, question, answer, is_daily_double, position FROM questions WHERE category_id IN (?) ORDER BY position ASC',
    [categoryRows.length ? categoryRows.map((c) => c.id) : [0]]
  );
  const byCategory = new Map<number, QuestionData[]>();
  for (const row of questionRows) {
    const q: QuestionData = {
      id: row.id,
      value: row.value,
      question: row.question,
      answer: row.answer,
      isDailyDouble: !!row.is_daily_double,
      position: row.position
    };
    const list = byCategory.get(row.category_id) ?? [];
    list.push(q);
    byCategory.set(row.category_id, list);
  }

  return {
    id: boardRows[0].id,
    title: boardRows[0].title,
    categories: categoryRows.map((cat) => ({
      id: cat.id,
      title: cat.title,
      position: cat.position,
      questions: byCategory.get(cat.id) ?? []
    }))
  };
}

export async function getOrCreateGame(gameId: string) {
  const existing = activeGames.get(gameId);
  if (existing) return existing;

  const gameRows = await query<any[]>('SELECT id, board_id, status, current_picker_id FROM games WHERE id = ?', [gameId]);
  if (!gameRows.length) return null;
  const game = gameRows[0];
  const board = await loadBoard(game.board_id);
  const players = await query<any[]>('SELECT id, display_name, score, socket_id FROM players WHERE game_id = ?', [gameId]);
  const usedRows = await query<any[]>('SELECT question_id FROM used_questions WHERE game_id = ?', [gameId]);

  const active: ActiveGame = {
    gameId,
    boardId: game.board_id,
    hostSocketId: '',
    status: game.status,
    players: new Map(players.map((p) => [p.id, { displayName: p.display_name, score: p.score, socketId: p.socket_id ?? '' }])),
    board,
    usedQuestions: new Set(usedRows.map((u) => u.question_id)),
    currentPicker: game.current_picker_id,
    currentQuestion: null,
    finalJeopardy: null
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
  await query('UPDATE games SET status = ? WHERE id = ?', [status, gameId]);
  const g = activeGames.get(gameId);
  if (g) g.status = status;
}

export async function persistPlayerScore(gameId: string, playerId: string, score: number) {
  await query('UPDATE players SET score = ? WHERE id = ? AND game_id = ?', [score, playerId, gameId]);
}

export async function markQuestionUsed(gameId: string, questionId: number) {
  await query('INSERT IGNORE INTO used_questions (game_id, question_id) VALUES (?, ?)', [gameId, questionId]);
}

export function scoreList(game: ActiveGame) {
  return Array.from(game.players.entries()).map(([id, p]) => ({ playerId: id, displayName: p.displayName, score: p.score }));
}

export function boardState(game: ActiveGame) {
  return {
    board: game.board,
    usedQuestions: Array.from(game.usedQuestions.values()),
    scores: scoreList(game),
    currentPicker: game.currentPicker
  };
}
