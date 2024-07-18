// lib/db.ts
import Database from 'better-sqlite3';

const db = new Database('game.db');

db.prepare(`
  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    email TEXT,
    phone TEXT,
    highscore INTEGER DEFAULT 0
  )
`).run();

export default db;