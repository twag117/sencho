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
  );
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
  );
`)

db.run(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_attempts_user_day
    ON attempts(user_id, puzzle_date)
    WHERE user_id IS NOT NULL;
`)

db.run(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_attempts_guest_day
    ON attempts(guest_id, puzzle_date)
    WHERE guest_id IS NOT NULL;
`)

export function getRegularPuzzleCount() {
  return db.query(`SELECT COUNT(*) as count FROM puzzles WHERE special_date IS NULL`).get().count
}

export function getTodaysPuzzle(dateStr, puzzleIndex) {
  const special = db.query(`SELECT * FROM puzzles WHERE special_date = ?`).get(dateStr)
  if (special) {
    return special
  }

  return db.query(`
    SELECT * FROM puzzles
    WHERE special_date IS NULL
    ORDER BY id
    LIMIT 1 OFFSET ?
  `).get(puzzleIndex)
}

export function getPuzzleById(puzzleId) {
  return db.query(`SELECT * FROM puzzles WHERE id = ?`).get(puzzleId)
}

export function getAttempts(userId, guestId, displayName, puzzleId, puzzleDate) {
  const identityCol = userId ? 'user_id' : 'guest_id'
  const identityVal = userId ? userId : guestId

  const existing = db.query(`
    SELECT * FROM attempts WHERE ${identityCol} = ? AND puzzle_date = ?
  `).get(identityVal, puzzleDate)

  if (existing) {
    return existing
  }

  const nowSeconds = Math.floor(Date.now() / 1000)

  return db.query(`
    INSERT INTO attempts
      (user_id, guest_id, display_name, puzzle_id, puzzle_date, modified_at)
    VALUES (?, ?, ?, ?, ?, ?)
    RETURNING *
  `).get(userId ?? null, guestId ?? null, displayName, puzzleId, puzzleDate, nowSeconds)
}

export function recordGuess(attemptId, correct, score) {
  const nowSeconds = Math.floor(Date.now() / 1000)

  if (correct) {
    return db.query(`
      UPDATE attempts
      SET guesses = guesses + 1,
          status = 'completed',
          score = ?,
          completed_at = ?,
          modified_at = ?
      WHERE id = ?
      RETURNING *
    `).get(score, nowSeconds, nowSeconds, attemptId)
  }

  return db.query(`
    UPDATE attempts
    SET guesses = guesses + 1,
        modified_at = ?
    WHERE id = ?
    RETURNING *
  `).get(nowSeconds, attemptId)
}