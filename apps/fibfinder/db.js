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

console.log(getRegularPuzzleCount())

// db.run(`INSERT INTO puzzles (special_date, category, statements, fib_index, fib_explanation) VALUES ('2026-12-25', 'Christmas Traditions', '["Christmas trees were first popularized in America by Prince Albert and Queen Victoria of England in the 1840s.","Rudolph the Red-Nosed Reindeer was created by the Montgomery Ward department store in 1939.","The tradition of hanging stockings comes from Saint Nicholas dropping gold coins down a chimney.","Candy canes were originally white and only became red and white striped in the 1600s.","Santa Claus is based on Saint Nicholas, a real bishop from Turkey."]', 3, 'Candy canes were actually created as red and white striped sweets much later than the 1600s. The original candy canes from the 17th century were plain white and straight. The red stripes and curved shape we know today were not standardized until the 1800s, with commercial production of red and white striped candy canes beginning in the late 1800s and early 1900s.')`)

// db.run(`INSERT INTO puzzles (special_date, category, statements, fib_index, fib_explanation) VALUES ('2026-11-26', 'Thanksgiving History', '["Thanksgiving became a national holiday in America in 1863 when President Abraham Lincoln proclaimed it.","The first Thanksgiving feast in 1621 was celebrated by Pilgrims and Native Americans.","Turkey was likely served at the first Thanksgiving celebration in 1621.","Thanksgiving is celebrated on the fourth Thursday of November.","The Pilgrims traveled on a ship called the Mayflower."]', 2, 'While turkey is now the traditional Thanksgiving bird, there is no historical evidence that turkey was actually served at the first Thanksgiving in 1621. Contemporary accounts and historical records suggest the feast likely included wildfowl such as ducks and geese, as well as deer, but turkey was not documented as part of that meal. Turkey became associated with Thanksgiving celebrations much later, over centuries, and is now the dominant tradition.')`)

// db.run(`INSERT INTO puzzles (special_date, category, statements, fib_index, fib_explanation) VALUES ('2026-11-11', 'Veterans Day Facts', '["Veterans Day is celebrated on November 11th each year.","Veterans Day commemorates the end of World War I, which occurred on November 11, 1918.","Originally called Armistice Day, the holiday was renamed Veterans Day in 1978.","Veterans Day honors all military veterans, while Memorial Day honors those who died in service.","The United States is the only country that celebrates Veterans Day on November 11th."]', 4, 'Many countries around the world celebrate November 11th as a day honoring military veterans and the end of World War I, including Canada (Remembrance Day), France, Germany, Australia, and numerous other nations. It is not unique to the United States. The date November 11 holds international significance because it marks the armistice that ended World War I in 1918.')`)

// db.run(`INSERT INTO puzzles (special_date, category, statements, fib_index, fib_explanation) VALUES ('2027-03-28', 'Easter Traditions', '["Easter eggs are dyed and hidden as part of the Easter Bunny tradition dating back to ancient times.","The Easter Bunny is believed to have origins in pagan spring festivals.","Hot cross buns are traditionally eaten on Good Friday before Easter Sunday.","The word Easter comes from Eostre, an ancient Germanic goddess of spring.","Easter is always celebrated on a Sunday between March 22 and April 25."]', 0, 'While Easter egg hunts and the Easter Bunny are popular modern traditions, they do not date back to ancient times. The Easter Bunny tradition actually originated in 16th-century Germany and was brought to America by German immigrants in the 1700s. Easter eggs themselves became associated with the holiday much later through Christian symbolism (resurrection), and the practice of dyeing and hunting them is a relatively modern tradition that developed over centuries, not an ancient custom.')`)


console.log(getRegularPuzzleCount())
