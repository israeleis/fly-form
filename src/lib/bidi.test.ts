import { describe, expect, it } from 'vitest'
import { formatContactAddressForPdf, formatPdfTextForBidi, reverseLtrRunForPdf } from './bidi'

describe('bidi helpers', () => {
  it('reverses LTR runs before writing to PDF', () => {
    expect(reverseLtrRunForPdf('13')).toBe('31')
  })

  it('reverses the house number inside a Hebrew address', () => {
    expect(formatContactAddressForPdf('המעלות', '13', 'קרית ים')).toBe(
      'המעלות 31 קרית ים'
    )
  })

  it('reverses numeric and ASCII runs for general PDF text', () => {
    expect(formatPdfTextForBidi('052-4561238')).toBe('8321654-250')
    expect(formatPdfTextForBidi('23/04/2026')).toBe('6202/40/32')
    expect(formatPdfTextForBidi('המעלות 13 קרית ים')).toBe('המעלות 31 קרית ים')
  })
})
