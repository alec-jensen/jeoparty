import { mysqlTable, int, varchar, text, boolean, timestamp, primaryKey } from 'drizzle-orm/mysql-core';

export const hosts = mysqlTable('hosts', {
  id: int('id').autoincrement().primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const authTokens = mysqlTable('auth_tokens', {
  id: int('id').autoincrement().primaryKey(),
  hostId: int('host_id').notNull().references(() => hosts.id, { onDelete: 'cascade' }),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const boards = mysqlTable('boards', {
  id: int('id').autoincrement().primaryKey(),
  hostId: int('host_id').notNull().references(() => hosts.id),
  title: varchar('title', { length: 255 }).notNull(),
  // Final Jeopardy clue (required to publish; one per board)
  finalCategory: varchar('final_category', { length: 255 }),
  finalQuestion: text('final_question'),
  finalAnswer: text('final_answer'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
});

export const rounds = mysqlTable('rounds', {
  id: int('id').autoincrement().primaryKey(),
  boardId: int('board_id').notNull().references(() => boards.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  position: int('position').notNull(),
});

export const categories = mysqlTable('categories', {
  id: int('id').autoincrement().primaryKey(),
  roundId: int('round_id').notNull().references(() => rounds.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  position: int('position').notNull(),
});

export const questions = mysqlTable('questions', {
  id: int('id').autoincrement().primaryKey(),
  categoryId: int('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  value: int('value').notNull(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  isDailyDouble: boolean('is_daily_double').default(false),
  position: int('position').notNull(),
});

export const games = mysqlTable('games', {
  id: varchar('id', { length: 4 }).primaryKey(),
  boardId: int('board_id').notNull().references(() => boards.id),
  hostId: int('host_id').notNull().references(() => hosts.id),
  teamMode: boolean('team_mode').default(false),
  numTeams: int('num_teams').default(0),
  status: varchar('status', { length: 20 }).notNull().default('lobby'),
  currentPickerId: varchar('current_picker_id', { length: 36 }),
  currentRound: int('current_round').default(0),
  optDailyDoubles: boolean('opt_daily_doubles').default(true),
  optSoundEffects: boolean('opt_sound_effects').default(true),
  optShuffle: boolean('opt_shuffle').default(false),
  currentQuestionJson: text('current_question_json'),
  finalJeopardyJson: text('final_jeopardy_json'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const teams = mysqlTable('teams', {
  id: int('id').autoincrement().primaryKey(),
  gameId: varchar('game_id', { length: 4 }).notNull().references(() => games.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 64 }).notNull(),
  position: int('position').notNull(),
});

export const players = mysqlTable('players', {
  id: varchar('id', { length: 36 }).primaryKey(),
  gameId: varchar('game_id', { length: 4 }).notNull().references(() => games.id, { onDelete: 'cascade' }),
  teamId: int('team_id').references(() => teams.id),
  displayName: varchar('display_name', { length: 64 }).notNull(),
  score: int('score').default(0),
  socketId: varchar('socket_id', { length: 255 }),
  avatarColor: int('avatar_color').default(0),
  avatarShape: int('avatar_shape').default(0),
});

export const usedQuestions = mysqlTable('used_questions', {
  gameId: varchar('game_id', { length: 4 }).notNull().references(() => games.id, { onDelete: 'cascade' }),
  questionId: int('question_id').notNull().references(() => questions.id),
}, (t) => [primaryKey({ columns: [t.gameId, t.questionId] })]);

export type Host = typeof hosts.$inferSelect;
export type Board = typeof boards.$inferSelect;
export type Round = typeof rounds.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type Game = typeof games.$inferSelect;
export type Team = typeof teams.$inferSelect;
export type Player = typeof players.$inferSelect;
