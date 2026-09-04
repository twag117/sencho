CREATE TABLE IF NOT EXISTS puzzles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  special_date TEXT,
  category TEXT NOT NULL,
  statements TEXT NOT NULL,
  fib_index INTEGER NOT NULL,
  fib_explanation TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_attempts_user_day
  ON attempts(user_id, puzzle_date)
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_attempts_guest_day
  ON attempts(guest_id, puzzle_date)
  WHERE guest_id IS NOT NULL;