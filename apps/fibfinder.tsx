import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { Layout } from '../shared/layout'

// --- GAME LOGIC ---
const PUZZLE_START_DATE = '2026-07-16'
const POINTS_PER_EXTRA_GUESS = 100
const POINTS_PER_EXTRA_SECOND = 2
const FREE_SECONDS = 5

const getCentralDateString = (date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(date)

const puzzleIndexForDate = (dateStr: string, startDateStr = PUZZLE_START_DATE, totalPuzzles: number) => {
  const msPerDay = 1000 * 60 * 60 * 24
  const daysSinceStart = Math.floor((new Date(dateStr).getTime() - new Date(startDateStr).getTime()) / msPerDay)
  return daysSinceStart % totalPuzzles
}

const isCorrectGuess = (puzzle: any, guessIndex: number) => guessIndex === puzzle.fib_index

const calculateScore = (guesses: number, elapsedSeconds: number) => {
  const guessPenalty = (guesses - 1) * POINTS_PER_EXTRA_GUESS
  const secondsOver = Math.max(0, elapsedSeconds - FREE_SECONDS)
  const timePenalty = secondsOver * POINTS_PER_EXTRA_SECOND
  return Math.max(0, 1000 - guessPenalty - timePenalty)
}

const buildShareText = ({ puzzleNumber, guesses, elapsedSeconds, score }: any) => {
  const wrongMarks = '❌'.repeat(Math.max(0, guesses - 1))
  const emojiRow = wrongMarks + '✅'
  const guessWord = guesses === 1 ? 'guess' : 'guesses'
  return `Fib Finder #${puzzleNumber}\n${emojiRow}\n${guesses} ${guessWord} · ${elapsedSeconds}s · ${score} pts\n\nhttps://sencho.app`
}

// --- HELPER ---
function getIdentity(c: any) {
  const user = c.get('user')
  if (user) return { userId: user.id, guestId: null, displayName: user.email }

  let guestId = getCookie(c, 'guest_id')
  if (!guestId) {
    guestId = crypto.randomUUID()
    setCookie(c, 'guest_id', guestId, { path: '/', httpOnly: true, maxAge: 31536000 })
  }
  return { userId: null, guestId, displayName: `Anon${Math.floor(10000 + Math.random() * 90000)}` }
}

// --- APP ROUTES ---
export const fibFinderApp = new Hono()

fibFinderApp.get('/', async (c) => {
  const user = c.get('user')
  const db = c.env.FIBFINDER_DB
  const today = getCentralDateString()

  const countRow = await db.prepare(`SELECT COUNT(*) as count FROM puzzles WHERE special_date IS NULL`).first()
  const puzzleIndex = puzzleIndexForDate(today, PUZZLE_START_DATE, countRow?.count || 0)

  let puzzle = await db.prepare(`SELECT * FROM puzzles WHERE special_date = ?`).bind(today).first()
  if (!puzzle) {
    puzzle = await db.prepare(
      `SELECT * FROM puzzles WHERE special_date IS NULL ORDER BY id LIMIT 1 OFFSET ?`
    ).bind(puzzleIndex).first()
  }

  if (!puzzle) return c.text("No puzzle found for today!", 404)

  const statements = JSON.parse(puzzle.statements as string)
  const { userId, guestId, displayName } = getIdentity(c)
  const identityCol = userId ? 'user_id' : 'guest_id'
  const identityVal = userId ? userId : guestId

  let attempt = await db.prepare(
    `SELECT * FROM attempts WHERE ${identityCol} = ? AND puzzle_date = ?`
  ).bind(identityVal, today).first()

  if (!attempt) {
    const nowSeconds = Math.floor(Date.now() / 1000)
    await db.prepare(
      `INSERT INTO attempts (user_id, guest_id, display_name, puzzle_id, puzzle_date, created_at, modified_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(userId ?? null, guestId ?? null, displayName, puzzle.id, today, nowSeconds, nowSeconds).run()

    attempt = await db.prepare(
      `SELECT * FROM attempts WHERE ${identityCol} = ? AND puzzle_date = ?`
    ).bind(identityVal, today).first()
  }

  if (attempt?.status === 'completed') {
    const elapsedSeconds = (attempt.completed_at as number) - (attempt.created_at as number)
    const shareText = buildShareText({
      puzzleNumber: puzzle.id,
      guesses: attempt.guesses,
      elapsedSeconds,
      score: attempt.score,
    })

    return c.html(
      <Layout title="Fib Finder" user={user}>
        <h1 className="text-3xl font-bold">Fib Finder</h1>
        <p>Solved! The fib was:</p>
        <blockquote className="p-4 bg-gray-200 rounded my-2">{statements[puzzle.fib_index as number]}</blockquote>
        <p className="italic">{puzzle.fib_explanation}</p>
        <p className="mt-4">{attempt.guesses} guesses · {elapsedSeconds}s · {attempt.score} pts</p>
        <textarea readOnly rows={5} className="w-full p-2 border">{shareText}</textarea>
        <button
          className="mt-2 bg-blue-500 text-white p-2 rounded"
          onclick={`navigator.clipboard.writeText(${JSON.stringify(shareText)}); this.textContent = 'Copied!'`}
        >
          Copy Score
        </button>
        <p className="mt-4">Come back tomorrow for a new one.</p>
      </Layout>
    )
  }

  return c.html(
    <Layout title="Fib Finder" user={user}>
      <h1 className="text-3xl font-bold">Fib Finder</h1>
      <p>{puzzle.category} — find the fib.</p>
      {(attempt?.guesses as number) > 0 && <p>{attempt?.guesses} wrong guess{attempt?.guesses === 1 ? '' : 'es'} so far — try again.</p>}
      <div className="flex flex-col gap-2 mt-4">
        {statements.map((text: string, i: number) => (
          <form method="post" action={`/fibfinder/${puzzle.id}/${today}/guess/${i}`} key={i}>
            <button type="submit" className="w-full text-left p-2 border hover:bg-gray-100">
              {text}
            </button>
          </form>
        ))}
      </div>
    </Layout>
  )
})

fibFinderApp.post('/:id/:date/guess/:index', async (c) => {
  const puzzleId = c.req.param('id')
  const puzzleDate = c.req.param('date')
  const guessIndex = Number(c.req.param('index'))
  const db = c.env.FIBFINDER_DB

  const puzzle = await db.prepare(`SELECT * FROM puzzles WHERE id = ?`).bind(puzzleId).first()
  const { userId, guestId, displayName } = getIdentity(c)

  const identityCol = userId ? 'user_id' : 'guest_id'
  const identityVal = userId ? userId : guestId
  const attempt = await db.prepare(
    `SELECT * FROM attempts WHERE ${identityCol} = ? AND puzzle_date = ?`
  ).bind(identityVal, puzzleDate).first()

  if (attempt?.status === 'completed') return c.redirect('/fibfinder', 303)

  const correct = isCorrectGuess(puzzle, guessIndex)
  const guessesSoFar = ((attempt?.guesses as number) || 0) + 1
  const nowSeconds = Math.floor(Date.now() / 1000)

  if (correct) {
    const elapsedSeconds = nowSeconds - ((attempt?.created_at as number) || nowSeconds)
    const score = calculateScore(guessesSoFar, elapsedSeconds)
    await db.prepare(
      `UPDATE attempts SET guesses = ?, status = 'completed', score = ?, completed_at = ?, modified_at = ? WHERE id = ?`
    ).bind(guessesSoFar, score, nowSeconds, nowSeconds, attempt?.id).run()
  } else {
    await db.prepare(
      `UPDATE attempts SET guesses = ?, modified_at = ? WHERE id = ?`
    ).bind(guessesSoFar, nowSeconds, attempt?.id).run()
  }

  return c.redirect('/fibfinder', 303)
})