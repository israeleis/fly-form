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

function calcDrawY(box: FieldBox, size: number, lineHeight: number, lineCount: number): number {
  const totalHeight = lineCount * lineHeight
  const topOffset = Math.max((box.height - totalHeight) / 2, 0)
  return box.y + topOffset + totalHeight - size
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
  const textWidth = font.widthOfTextAtSize(line, size)
  if (box.align === 'right') {
    return box.x + box.width - textWidth
  }
  if (box.align === 'left') {
    return box.x
  }
  return box.x + (box.width - textWidth) / 2
}

export function fitText(
  text: string,
  box: FieldBox,
  font: PDFFont,
  maxSize = box.maxSize ?? MAX_FONT_SIZE,
  minSize = MIN_FONT_SIZE,
): FitResult {
  const maxLines = box.maxLines ?? Number.POSITIVE_INFINITY

  // Phase 1: optional wrap-first mode for fields that read better on multiple lines.
  if (box.preferWrap) {
    for (let size = maxSize; size >= minSize; size--) {
      const lines = wordWrap(text, box.width, font, size)
      const lineHeight = size * 1.2
      if (lines.length > 1 && lines.length <= maxLines && lines.length * lineHeight <= box.height) {
        return {
          lines,
          size,
          drawX: calcDrawX(lines[0], box, font, size),
          drawY: calcDrawY(box, size, lineHeight, lines.length),
          lineHeight,
        }
      }
    }
  }

  // Phase 2: single-line shrink
  for (let size = maxSize; size >= minSize; size--) {
    if (font.widthOfTextAtSize(text, size) <= box.width) {
      const lineHeight = size * 1.2
      return {
        lines: [text],
        size,
        drawX: calcDrawX(text, box, font, size),
        drawY: calcDrawY(box, size, lineHeight, 1),
        lineHeight,
      }
    }
  }

  // Phase 3: word-wrap shrink
  for (let size = maxSize; size >= minSize; size--) {
    const lines = wordWrap(text, box.width, font, size)
    const lineHeight = size * 1.2
    if (lines.length <= maxLines && lines.length * lineHeight <= box.height) {
      return {
        lines,
        size,
        drawX: calcDrawX(lines[0], box, font, size),
        drawY: calcDrawY(box, size, lineHeight, lines.length),
        lineHeight,
      }
    }
  }

  // Phase 4: best effort at min size
  const size = minSize
  const lines = wordWrap(text, box.width, font, size).slice(0, maxLines)
  const lineHeight = size * 1.2
  return {
    lines,
    size,
    drawX: calcDrawX(lines[0], box, font, size),
    drawY: calcDrawY(box, size, lineHeight, lines.length),
    lineHeight,
  }
}
