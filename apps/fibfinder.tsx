import { Hono } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { Layout } from '../shared/layout'
import { getSupabase } from '../shared/supabase'

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
  const supabase = getSupabase(c.env)
  const today = getCentralDateString()
  
  const { count } = await supabase.from('puzzles').select('*', { count: 'exact', head: true })
  const puzzleIndex = puzzleIndexForDate(today, PUZZLE_START_DATE, count || 0)

  let { data: puzzle } = await supabase.from('puzzles').select('*').eq('special_date', today).single()
  if (!puzzle) {
    const { data: list } = await supabase.from('puzzles').select('*').is('special_date', null).order('id').range(puzzleIndex, puzzleIndex)
    puzzle = list?.[0]
  }

  if (!puzzle) return c.text("No puzzle found for today!", 404)

  const statements = puzzle.statements 
  const { userId, guestId, displayName } = getIdentity(c)
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
      created_at: nowSeconds,
      modified_at: nowSeconds
    }).select().single()
    attempt = newAttempt
  }

  if (attempt?.status === 'completed') {
    const elapsedSeconds = attempt.completed_at - attempt.created_at
    const shareText = buildShareText({
      puzzleNumber: puzzle.id,
      guesses: attempt.guesses,
      elapsedSeconds,
      score: attempt.score,
    })

    return c.html(
      <Layout title="Fib Finder">
        <h1 className="text-3xl font-bold">Fib Finder</h1>
        <p>Solved! The fib was:</p>
        <blockquote className="p-4 bg-gray-200 rounded my-2">{statements[puzzle.fib_index]}</blockquote>
        <p className="italic">{puzzle.fib_explanation}</p>
        <p className="mt-4">{attempt.guesses} guesses · {elapsedSeconds}s · {attempt.score} pts</p>
        <textarea readOnly rows="5" className="w-full p-2 border">{shareText}</textarea>
        <button 
          className="mt-2 bg-blue-500 text-white p-2 rounded"
          onClick={`navigator.clipboard.writeText(${JSON.stringify(shareText)}); this.textContent = 'Copied!'`}
        >
          Copy Score
        </button>
        <p className="mt-4">Come back tomorrow for a new one.</p>
      </Layout>
    )
  }

  return c.html(
    <Layout title="Fib Finder">
      <h1 className="text-3xl font-bold">Fib Finder</h1>
      <p>{puzzle.category} — find the fib.</p>
      {attempt?.guesses > 0 && <p>{attempt.guesses} wrong guess{attempt.guesses === 1 ? '' : 'es'} so far — try again.</p>}
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
    const elapsedSeconds = nowSeconds - (attempt?.created_at || nowSeconds)
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
