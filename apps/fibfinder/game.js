export const PUZZLE_START_DATE = '2026-07-13'

export function getCentralDateString(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(date)
}

export function puzzleIndexForDate(dateStr, startDateStr = PUZZLE_START_DATE, totalPuzzles) {
  const msPerDay = 1000 * 60 * 60 * 24
  const daysSinceStart = Math.floor((new Date(dateStr) - new Date(startDateStr)) / msPerDay)
  return daysSinceStart % totalPuzzles
}

export function isCorrectGuess(puzzle, guessIndex) {
  return guessIndex === puzzle.fib_index
}

const POINTS_PER_EXTRA_GUESS = 100
const POINTS_PER_EXTRA_SECOND = 2
const FREE_SECONDS = 5

export function calculateScore(guesses, elapsedSeconds) {
  const guessPenalty = (guesses - 1) * POINTS_PER_EXTRA_GUESS
  const secondsOver = Math.max(0, elapsedSeconds - FREE_SECONDS)
  const timePenalty = secondsOver * POINTS_PER_EXTRA_SECOND
  return Math.max(0, 1000 - guessPenalty - timePenalty)
}

export function buildShareText({ puzzleNumber, guesses, elapsedSeconds, score }) {
  const wrongMarks = '❌'.repeat(Math.max(0, guesses - 1))
  const emojiRow = wrongMarks + '✅'
  const guessWord = guesses === 1 ? 'guess' : 'guesses'
  return `Fib Finder #${puzzleNumber}\n${emojiRow}\n${guesses} ${guessWord} · ${elapsedSeconds}s · ${score} pts`
}