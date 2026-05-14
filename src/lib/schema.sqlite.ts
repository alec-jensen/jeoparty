import { sqliteTable, integer, text, primaryKey } from 'drizzle-orm/sqlite-core';

export const hosts = sqliteTable('hosts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const authTokens = sqliteTable('auth_tokens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  hostId: integer('host_id').notNull().references(() => hosts.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const boards = sqliteTable('boards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  hostId: integer('host_id').notNull().references(() => hosts.id),
  title: text('title').notNull(),
  finalCategory: text('final_category'),
  finalQuestion: text('final_question'),
  finalAnswer: text('final_answer'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const rounds = sqliteTable('rounds', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  boardId: integer('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  position: integer('position').notNull(),
});

export const categories = sqliteTable('categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  roundId: integer('round_id').notNull().references(() => rounds.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  position: integer('position').notNull(),
});

export const questions = sqliteTable('questions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  value: integer('value').notNull(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  isDailyDouble: integer('is_daily_double', { mode: 'boolean' }).default(false),
  position: integer('position').notNull(),
});

export const games = sqliteTable('games', {
  id: text('id').primaryKey(),
  boardId: integer('board_id').notNull().references(() => boards.id),
  hostId: integer('host_id').notNull().references(() => hosts.id),
  teamMode: integer('team_mode', { mode: 'boolean' }).default(false),
  numTeams: integer('num_teams').default(0),
  status: text('status').notNull().default('lobby'),
  currentPickerId: text('current_picker_id'),
  currentRound: integer('current_round').default(0),
  optDailyDoubles: integer('opt_daily_doubles', { mode: 'boolean' }).default(true),
  optSoundEffects: integer('opt_sound_effects', { mode: 'boolean' }).default(true),
  optShuffle: integer('opt_shuffle', { mode: 'boolean' }).default(false),
  currentQuestionJson: text('current_question_json'),
  finalJeopardyJson: text('final_jeopardy_json'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const teams = sqliteTable('teams', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  position: integer('position').notNull(),
});

export const players = sqliteTable('players', {
  id: text('id').primaryKey(),
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  teamId: integer('team_id').references(() => teams.id),
  displayName: text('display_name').notNull(),
  score: integer('score').default(0),
  socketId: text('socket_id'),
  avatarColor: integer('avatar_color').default(0),
  avatarShape: integer('avatar_shape').default(0),
});

export const usedQuestions = sqliteTable('used_questions', {
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  questionId: integer('question_id').notNull().references(() => questions.id),
}, (t) => [primaryKey({ columns: [t.gameId, t.questionId] })]);
