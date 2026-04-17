import { describe, expect, it } from 'vitest'
import { FONT_STYLE_OPTIONS, getFontStyleOption } from './fontStyles'

describe('fontStyles', () => {
  it('exposes multiple Hebrew font options including handwriting styles', () => {
    expect(FONT_STYLE_OPTIONS.map((option) => option.value)).toEqual([
      'rubik',
      'alef',
      'david-libre',
      'amatic-sc',
      'caveat',
      'fredoka-one',
    ])
    expect(FONT_STYLE_OPTIONS.filter((option) => option.badge === 'כתב יד')).toHaveLength(2)
  })

  it('falls back to Rubik when the stored value is unknown', () => {
    expect(getFontStyleOption('unknown-font' as never).value).toBe('rubik')
  })
})
