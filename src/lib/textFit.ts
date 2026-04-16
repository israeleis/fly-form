import type { PDFFont } from 'pdf-lib'
import { MAX_FONT_SIZE, MIN_FONT_SIZE } from './pdfCoords'
import type { FieldBox } from './pdfCoords'

export type FitResult = {
  lines: string[]
  size: number
  drawX: number
  drawY: number
  lineHeight: number
}

function wordWrap(text: string, maxWidth: number, font: PDFFont, size: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}

function calcDrawX(line: string, box: FieldBox, font: PDFFont, size: number): number {
  if (box.align === 'right') {
    return box.x + box.width - font.widthOfTextAtSize(line, size)
  }
  return box.x
}

export function fitText(
  text: string,
  box: FieldBox,
  font: PDFFont,
  maxSize = MAX_FONT_SIZE,
  minSize = MIN_FONT_SIZE,
): FitResult {
  // Phase 1: single-line shrink
  for (let size = maxSize; size >= minSize; size--) {
    if (font.widthOfTextAtSize(text, size) <= box.width) {
      const lineHeight = size * 1.2
      return {
        lines: [text],
        size,
        drawX: calcDrawX(text, box, font, size),
        drawY: box.y + box.height - size,
        lineHeight,
      }
    }
  }

  // Phase 2: word-wrap shrink
  for (let size = maxSize; size >= minSize; size--) {
    const lines = wordWrap(text, box.width, font, size)
    const lineHeight = size * 1.2
    if (lines.length * lineHeight <= box.height) {
      return {
        lines,
        size,
        drawX: calcDrawX(lines[0], box, font, size),
        drawY: box.y + box.height - size,
        lineHeight,
      }
    }
  }

  // Phase 3: best effort at min size
  const size = minSize
  const lines = wordWrap(text, box.width, font, size)
  const lineHeight = size * 1.2
  return {
    lines,
    size,
    drawX: calcDrawX(lines[0], box, font, size),
    drawY: box.y + box.height - size,
    lineHeight,
  }
}
