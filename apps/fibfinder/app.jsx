/** @jsxImportSource hono/jsx */
import { Hono } from "hono"
import { Layout } from "../../shared/layout"
import { getCentralDateString, isCorrectGuess, PUZZLE_START_DATE, puzzleIndexForDate } from "./game"
import { getPuzzleById, getRegularPuzzleCount, getTodaysPuzzle } from "./db"

export const fibFinderApp = new Hono()

fibFinderApp.get('/fibfinder', (c) => {
  const today = getCentralDateString()
  const puzzleCount = getRegularPuzzleCount()
  const puzzleIndex = puzzleIndexForDate(today, PUZZLE_START_DATE, puzzleCount)
  const puzzle = getTodaysPuzzle(today, puzzleIndex)
  const statements = JSON.parse(puzzle.statements)
  const attempts = getAttempts(c.get('user_id'), c.get('guest_id'), c.get('display_name'), puzzle.id, today)

  return c.html(
    <Layout title="Fib Finder">
      <h1>Fib Finder</h1>
      <p>Find the fib daily.</p>
      <p>Today: {today}</p>
      <p>Puzzle Count: {puzzleCount}</p>
      <p>Puzzle Index: {puzzleIndex}</p>
      <div>
        <strong><u>Puzzle Details</u></strong><br/>
        <strong>ID:</strong> {puzzle.id}<br/>
        <strong>Special Date:</strong> {puzzle.special_date}<br/>
        <strong>Category:</strong> {puzzle.category}<br/>
        <strong>Statements:</strong> {puzzle.statements}<br/>
        <strong>Fib Index:</strong> {puzzle.fib_index}<br/>
        <strong>Fib Explanation:</strong> {puzzle.fib_explanation}<br/>
        <strong>Created At:</strong> {puzzle.created_at}<br/>
      </div>
      <div>
        {statements.map((text, i) => (
          <form method="post" action={`/fibfinder/${puzzle.id}/guess/${i}`} key={i}>
            <button type="submit">{text}</button>
          </form>
        ))}
      </div>
    </Layout>
  )
})

fibFinderApp.post('/fibfinder/{id}/guess/{index}', (c) => {
  const puzzleId = c.param('id')
  const guessIndex = c.param('index')
  const puzzle = getPuzzleById(puzzleId)
  const guess = isCorrectGuess(puzzle, guessIndex)
  

  return guess
})