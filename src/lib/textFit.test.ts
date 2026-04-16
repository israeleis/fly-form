import { describe, it, expect } from 'vitest'
import { fitText } from './textFit'
import type { FieldBox } from './pdfCoords'

// Minimal PDFFont mock: widthOfTextAtSize returns charCount * size * 0.6
function mockFont(charsPerPt = 0.6) {
  return {
    widthOfTextAtSize: (text: string, size: number) => text.length * size * charsPerPt,
  } as any
}

const LEFT_BOX: FieldBox  = { x: 10, y: 100, width: 100, height: 30 }
const RIGHT_BOX: FieldBox = { x: 10, y: 100, width: 100, height: 30, align: 'right' }

describe('fitText — single line', () => {
  it('returns max font size when text fits at max size', () => {
    // "Hi" = 2 chars × 12 × 0.6 = 14.4 — fits in width=100
    const result = fitText('Hi', LEFT_BOX, mockFont())
    expect(result.size).toBe(12)
    expect(result.lines).toEqual(['Hi'])
  })

  it('shrinks font until text fits', () => {
    // 15 chars × size × 0.6 <= 100  →  size <= 11.1  →  size=11
    const text = '123456789012345' // 15 chars
    const result = fitText(text, LEFT_BOX, mockFont())
    expect(result.size).toBe(11)
    expect(result.lines).toEqual([text])
  })

  it('uses left alignment: drawX equals box.x', () => {
    const result = fitText('Hi', LEFT_BOX, mockFont())
    expect(result.drawX).toBe(LEFT_BOX.x)
  })

  it('uses right alignment: drawX = box.x + box.width - textWidth', () => {
    // "Hi" = 2 × 12 × 0.6 = 14.4
    const result = fitText('Hi', RIGHT_BOX, mockFont())
    expect(result.drawX).toBeCloseTo(RIGHT_BOX.x + RIGHT_BOX.width - 14.4)
  })

  it('drawY positions baseline near top of box', () => {
    const result = fitText('Hi', LEFT_BOX, mockFont())
    // drawY = box.y + box.height - size = 100 + 30 - 12 = 118
    expect(result.drawY).toBe(118)
  })
})

describe('fitText — multiline fallback', () => {
  it('word-wraps when single line cannot fit at min size', () => {
    // "aaa bbb ccc ddd eee fff ggg" = 27 chars
    // At size 12: 27 × 12 × 0.6 = 194.4 > 100 → wrap
    const text = 'aaa bbb ccc ddd eee fff ggg'
    const result = fitText(text, LEFT_BOX, mockFont())
    expect(result.lines.length).toBeGreaterThan(1)
    expect(result.lines.join(' ')).toBe(text)
  })

  it('lineHeight is size * 1.2', () => {
    const text = 'aaa bbb ccc ddd eee fff ggg'
    const result = fitText(text, LEFT_BOX, mockFont())
    expect(result.lineHeight).toBeCloseTo(result.size * 1.2)
  })

  it('each line fits within box width', () => {
    const text = 'aaa bbb ccc ddd eee fff ggg'
    const font = mockFont()
    const result = fitText(text, LEFT_BOX, font)
    result.lines.forEach(line => {
      expect(font.widthOfTextAtSize(line, result.size)).toBeLessThanOrEqual(LEFT_BOX.width)
    })
  })
})
