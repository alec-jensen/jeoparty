import mysql from 'mysql2/promise';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

export const pool = mysql.createPool(databaseUrl);

let schemaReady: Promise<void> | null = null;

export function ensureSchema() {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    await pool.query(`
CREATE TABLE IF NOT EXISTS hosts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);
    await pool.query(`
CREATE TABLE IF NOT EXISTS auth_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  host_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (host_id) REFERENCES hosts(id) ON DELETE CASCADE
)`);
    await pool.query(`
CREATE TABLE IF NOT EXISTS boards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  host_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (host_id) REFERENCES hosts(id)
)`);
    await pool.query(`
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  board_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  position INT NOT NULL,
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
)`);
    await pool.query(`
CREATE TABLE IF NOT EXISTS questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  value INT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  is_daily_double BOOLEAN DEFAULT FALSE,
  position INT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
)`);
    await pool.query(`
CREATE TABLE IF NOT EXISTS games (
  id VARCHAR(36) PRIMARY KEY,
  board_id INT NOT NULL,
  host_id INT NOT NULL,
  status ENUM('lobby','active','final_jeopardy','finished') DEFAULT 'lobby',
  current_picker_id VARCHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (board_id) REFERENCES boards(id),
  FOREIGN KEY (host_id) REFERENCES hosts(id)
)`);
    await pool.query(`
CREATE TABLE IF NOT EXISTS players (
  id VARCHAR(36) PRIMARY KEY,
  game_id VARCHAR(36) NOT NULL,
  display_name VARCHAR(64) NOT NULL,
  score INT DEFAULT 0,
  socket_id VARCHAR(255) NULL,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
)`);
    await pool.query(`
CREATE TABLE IF NOT EXISTS used_questions (
  game_id VARCHAR(36) NOT NULL,
  question_id INT NOT NULL,
  PRIMARY KEY (game_id, question_id),
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id)
)`);
  })();
  return schemaReady;
}

export async function query<T>(sql: string, params: unknown[] = []) {
  await ensureSchema();
  const [rows] = await pool.query(sql, params);
  return rows as T;
}
