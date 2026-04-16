import { describe, it, expect } from 'vitest'
import { calcDays } from './calcDays'

describe('calcDays', () => {
  it('returns 1 for same-day trip', () => {
    expect(calcDays('2026-04-16', '2026-04-16')).toBe(1)
  })

  it('returns correct days for a week trip', () => {
    expect(calcDays('2026-04-16', '2026-04-23')).toBe(8)
  })

  it('returns 0 for invalid range (return before departure)', () => {
    expect(calcDays('2026-04-23', '2026-04-16')).toBe(0)
  })

  it('returns 0 when either date is empty', () => {
    expect(calcDays('', '2026-04-16')).toBe(0)
    expect(calcDays('2026-04-16', '')).toBe(0)
  })

  it('returns 0 for invalid date strings', () => {
    expect(calcDays('not-a-date', '2026-04-16')).toBe(0)
    expect(calcDays('2026-04-16', 'invalid')).toBe(0)
  })
})
