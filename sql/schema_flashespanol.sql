CREATE TABLE IF NOT EXISTS words (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tier INTEGER NOT NULL CHECK (tier BETWEEN 1 AND 10),
  es TEXT NOT NULL,
  pronunciation TEXT NOT NULL,
  en TEXT NOT NULL,
  type TEXT NOT NULL CHECK (
    type IN ('noun','verb','adjective','adverb','pronoun','preposition','conjunction','determiner','interjection','number')
  ),
  image_url TEXT
);

CREATE INDEX IF NOT EXISTS idx_words_tier ON words (tier);