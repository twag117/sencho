/** @jsxImportSource hono/jsx */
import { Hono } from "hono"
import { getCookie, setCookie } from "hono/cookie"
import { Layout } from "../../shared/layout.jsx"
import { getSupabase } from "../../shared/supabaseClient.js"
import { getCentralDateString, PUZZLE_START_DATE, puzzleIndexForDate, isCorrectGuess, calculateScore, buildShareText } from "./game.js"

export const fibFinderApp = new Hono()

function getIdentity(c) {
  const user = c.get('user')
  if (user) return { userId: user.id, guestId: null, displayName: user.email }

  let guestId = getCookie(c, 'guest_id')
  if (!guestId) {
    guestId = crypto.randomUUID()
    setCookie(c, 'guest_id', guestId, { path: '/', httpOnly: true, maxAge: 31536000 })
  }
  return { userId: null, guestId, displayName: `Anon${Math.floor(10000 + Math.random() * 90000)}` }
}

fibFinderApp.get('/fibfinder', async (c) => {
  const user = c.get('user')
  const supabase = getSupabase(c.env)
  const today = getCentralDateString()
  
  // 1. Get puzzle count
  const { count } = await supabase.from('puzzles').select('*', { count: 'exact', head: true })
  const puzzleIndex = puzzleIndexForDate(today, PUZZLE_START_DATE, count)

  // 2. Get today's puzzle (Check special first, then offset)
  let { data: puzzle } = await supabase.from('puzzles').select('*').eq('special_date', today).single()
  if (!puzzle) {
    const { data: list } = await supabase.from('puzzles').select('*').is('special_date', null).order('id').range(puzzleIndex, puzzleIndex)
    puzzle = list?.[0]
  }

  const statements = puzzle.statements // Supabase returns JSONB as a JS array automatically
  const { userId, guestId, displayName } = getIdentity(c)

  // 3. Get or Create Attempt
  const identityCol = userId ? 'user_id' : 'guest_id'
  const identityVal = userId ? userId : guestId
  
  let { data: attempt } = await supabase.from('attempts').select('*').eq(identityCol, identityVal).eq('puzzle_date', today).single()

  if (!attempt) {
    const nowSeconds = Math.floor(Date.now() / 1000)
    const { data: newAttempt } = await supabase.from('attempts').insert({
      user_id: userId ?? null,
      guest_id: guestId ?? null,
      display_name: displayName,
      puzzle_id: puzzle.id,
      puzzle_date: today,
      modified_at: nowSeconds
    }).select().single()
    attempt = newAttempt
  }

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

fibFinderApp.post('/fibfinder/:id/:date/guess/:index', async (c) => {
  const puzzleId = c.req.param('id')
  const puzzleDate = c.req.param('date')
  const guessIndex = Number(c.req.param('index'))
  const supabase = getSupabase(c.env)
  
  const { data: puzzle } = await supabase.from('puzzles').select('*').eq('id', puzzleId).single()
  const { userId, guestId, displayName } = getIdentity(c)
  
  const identityCol = userId ? 'user_id' : 'guest_id'
  const identityVal = userId ? userId : guestId
  let { data: attempt } = await supabase.from('attempts').select('*').eq(identityCol, identityVal).eq('puzzle_date', puzzleDate).single()

  if (attempt?.status === 'completed') return c.redirect('/fibfinder', 303)

  const correct = isCorrectGuess(puzzle, guessIndex)
  const guessesSoFar = (attempt?.guesses || 0) + 1
  const nowSeconds = Math.floor(Date.now() / 1000)

  if (correct) {
    const elapsedSeconds = nowSeconds - attempt.created_at
    const score = calculateScore(guessesSoFar, elapsedSeconds)
    await supabase.from('attempts').update({
      guesses: guessesSoFar,
      status: 'completed',
      score: score,
      completed_at: nowSeconds,
      modified_at: nowSeconds
    }).eq('id', attempt.id)
  } else {
    await supabase.from('attempts').update({
      guesses: guessesSoFar,
      modified_at: nowSeconds
    }).eq('id', attempt.id)
  }

  return c.redirect('/fibfinder', 303)
})
