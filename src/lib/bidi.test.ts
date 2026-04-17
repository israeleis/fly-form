import { describe, expect, it } from 'vitest'
import { formatContactAddressForPdf, formatPdfTextForBidi, reverseLtrRunForPdf } from './bidi'

describe('bidi helpers', () => {
  it('keeps pure numbers unreversed', () => {
    expect(reverseLtrRunForPdf('13')).toBe('13')
  })

  it('keeps house numbers unreversed in Hebrew address', () => {
    expect(formatContactAddressForPdf('המעלות', '13', 'קרית ים')).toBe(
      'המעלות 13 קרית ים'
    )
  })

  it('keeps numbers unreversed in mixed text', () => {
    expect(formatPdfTextForBidi('052-4561238')).toBe('052-4561238')
    expect(formatPdfTextForBidi('23/04/2026')).toBe('23/04/2026')
    expect(formatPdfTextForBidi('המעלות 13 קרית ים')).toBe('המעלות 13 קרית ים')
  })
})
