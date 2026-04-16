export function calcDays(departure: string, returnDate: string): number {
  if (!departure || !returnDate) return 0
  const d1 = new Date(departure)
  const d2 = new Date(returnDate)
  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0
  const diffMs = d2.getTime() - d1.getTime()
  if (diffMs < 0) return 0
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1
}
