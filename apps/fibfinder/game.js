export const getCentralDateString = function(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago'}).format(date)
}

export const puzzleIndexForDate = function(dateStr, startDateStr, totalPuzzles) {
  const msPerDay = 1000*60*60*24
  const daysSinceStart = Math.floor((new Date(dateStr) - new Date(startDateStr)) / msPerDay)

  return daysSinceStart % totalPuzzles
}