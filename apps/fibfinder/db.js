import { Database } from "bun:sqlite"

const db = new Database(new URL("./fibfinder.db", import.meta.url).pathname)
db.run("PRAGMA journal_mode = WAL;")

db.run(`
  CREATE TABLE IF NOT EXISTS puzzles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    special_date TEXT,
    category TEXT NOT NULL,
    statements TEXT NOT NULL,
    fib_index INTEGER NOT NULL,
    fib_explanation TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
  )
  ;
`)

db.run(`
  CREATE TABLE IF NOT EXISTS attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    guest_id TEXT,
    display_name TEXT NOT NULL,
    puzzle_id INTEGER NOT NULL,
    puzzle_date TEXT NOT NULL,
    guesses INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'in_progress',
    score INTEGER,
    completed_at INTEGER,
    modified_at INTEGER NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
  )
  ;
`)

db.run(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_attempts_user_day
    ON attempts(user_id, puzzle_date)
    WHERE user_id IS NOT NULL
  ;
`)

db.run(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_attempts_guest_day
    ON attempts(guest_id, puzzle_date)
    WHERE guest_id IS NOT NULL
  ;
`)

export const getTodaysPuzzle = function(dateStr, puzzleIndex) {
  let todaysPuzzle = db.query(`
    SELECT * FROM puzzles WHERE special_date = ?
  `).get(dateStr)

  if (!todaysPuzzle) {
    todaysPuzzle = db.query(`
      SELECT * FROM puzzles WHERE id = ?
    `).get(puzzleIndex)
  }

  return todaysPuzzle
}