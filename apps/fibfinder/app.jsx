/** @jsxImportSource hono/jsx */
import { Hono } from "hono"
import { Layout } from "../../shared/layout"
import { getCentralDateString, PUZZLE_START_DATE, puzzleIndexForDate } from "./game"
import { getRegularPuzzleCount, getTodaysPuzzle } from "./db"

export const fibFinderApp = new Hono()

fibFinderApp.get('/fibfinder', (c) => {
  const today = '2026-12-25'//getCentralDateString()
  const puzzleCount = getRegularPuzzleCount()
  const puzzleIndex = puzzleIndexForDate(today, PUZZLE_START_DATE, puzzleCount)
  const puzzle = getTodaysPuzzle(today, puzzleIndex)

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
    </Layout>
  )
})