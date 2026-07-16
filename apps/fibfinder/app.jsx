/** @jsxImportSource hono/jsx */
import { Hono } from "hono"
import { getCookie, setCookie } from "hono/cookie"
import { Layout } from "../../shared/layout.jsx"
import { getCentralDateString, PUZZLE_START_DATE, puzzleIndexForDate, isCorrectGuess, calculateScore, buildShareText } from "./game.js"
import { getRegularPuzzleCount, getTodaysPuzzle, getPuzzleById, getAttempts, recordGuess } from "./db.js"

export const fibFinderApp = new Hono()

function getIdentity(c) {
  const user = c.get('user')
  if (user) {
    return { userId: user.id, guestId: null, displayName: user.email }
  }

  let guestId = getCookie(c, 'guest_id')
  if (!guestId) {
    guestId = crypto.randomUUID()
    setCookie(c, 'guest_id', guestId, { path: '/', httpOnly: true, maxAge: 31536000 })
  }

  return { userId: null, guestId, displayName: `Anon${Math.floor(10000 + Math.random() * 90000)}` }
}

fibFinderApp.get('/fibfinder', (c) => {
  const user = c.get('user')
  const today = getCentralDateString()
  const puzzleCount = getRegularPuzzleCount()
  const puzzleIndex = puzzleIndexForDate(today, PUZZLE_START_DATE, puzzleCount)
  const puzzle = getTodaysPuzzle(today, puzzleIndex)
  const statements = JSON.parse(puzzle.statements)

  const { userId, guestId, displayName } = getIdentity(c)
  const attempt = getAttempts(userId, guestId, displayName, puzzle.id, today)

  if (attempt.status === 'completed') {
    const elapsedSeconds = attempt.completed_at - attempt.created_at
    const shareText = buildShareText({
      puzzleNumber: puzzle.id,
      guesses: attempt.guesses,
      elapsedSeconds,
      score: attempt.score,
    })

    return c.html(
      <Layout title="Fib Finder" user={user}>
        <h1>Fib Finder</h1>
        <p>Solved! The fib was:</p>
        <blockquote>{statements[puzzle.fib_index]}</blockquote>
        <p>{puzzle.fib_explanation}</p>
        <p>{attempt.guesses} guesses · {elapsedSeconds}s · {attempt.score} pts</p>
        <textarea readonly rows="5">{shareText}</textarea>
        <button onclick={`navigator.clipboard.writeText(${JSON.stringify(shareText)}); this.textContent = 'Copied!'`}>
          Copy Score
        </button>
        <p><small>Copy needs HTTPS — works on your real domain, not plain http://.</small></p>
        <p>Come back tomorrow for a new one.</p>
      </Layout>
    )
  }

  return c.html(
    <Layout title="Fib Finder" user={user}>
      <h1>Fib Finder</h1>
      <p>{puzzle.category} — find the fib.</p>
      {attempt.guesses > 0 && <p>{attempt.guesses} wrong guess{attempt.guesses === 1 ? '' : 'es'} so far — try again.</p>}
      <div>
        {statements.map((text, i) => (
          <form method="post" action={`/fibfinder/${puzzle.id}/${today}/guess/${i}`} key={i}>
            <button type="submit">{text}</button>
          </form>
        ))}
      </div>
    </Layout>
  )
})

fibFinderApp.post('/fibfinder/:id/:date/guess/:index', (c) => {
  const puzzleId = c.req.param('id')
  const puzzleDate = c.req.param('date')
  const guessIndex = Number(c.req.param('index'))
  const puzzle = getPuzzleById(puzzleId)

  const { userId, guestId, displayName } = getIdentity(c)
  const attempt = getAttempts(userId, guestId, displayName, puzzle.id, puzzleDate)

  if (attempt.status === 'completed') {
    return c.redirect('/fibfinder', 303)
  }

  const correct = isCorrectGuess(puzzle, guessIndex)
  const guessesSoFar = attempt.guesses + 1

  if (correct) {
    const nowSeconds = Math.floor(Date.now() / 1000)
    const elapsedSeconds = nowSeconds - attempt.created_at
    const score = calculateScore(guessesSoFar, elapsedSeconds)
    recordGuess(attempt.id, true, score)
  } else {
    recordGuess(attempt.id, false, null)
  }

  return c.redirect('/fibfinder', 303)
})