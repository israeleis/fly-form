# PDF Text Fitting & Box Layout

**Date:** 2026-04-17
**Status:** Approved

## Problem

`pdfCoords.ts` stores only point positions (x, y) for each field. Text is drawn at a fixed font size (10pt) with no awareness of box boundaries, so long values overflow into adjacent fields. The template is Hebrew (RTL); section 2ב (flight route) needs right-aligned text.

## Goals

1. Store a bounding box for every input field.
2. Auto-shrink font (12→8pt) so text fits within the box.
3. Fall back to word-wrap (reset to 12pt, shrink again) when single-line won't fit at min size.
4. Right-align text in section 2ב (flightRoute).

## Box Coordinates

Page size: 595.92 × 842.88 pts. All coordinates in pdf-lib points (origin: bottom-left).

### Section 1 — Reserve service details, Row 1

| Field | x | y | width | height |
|---|---|---|---|---|
| personalNumber | 465 | 660 | 110 | 35 |
| lastName | 365 | 660 | 100 | 35 |
| firstName | 265 | 660 | 100 | 35 |
| rank | 175 | 660 | 90 | 35 |
| travelPurpose | 25 | 660 | 150 | 35 |

### Section 1 — Row 2 (contact person)

| Field | x | y | width | height |
|---|---|---|---|---|
| contactLastName | 365 | 600 | 100 | 35 |
| contactFirstName | 265 | 600 | 100 | 35 |
| contactAddress | 130 | 600 | 135 | 35 |
| contactPhone | 25 | 600 | 105 | 35 |

### Section 2 — Trip details

| Field | x | y | width | height |
|---|---|---|---|---|
| destinationCountry | 465 | 525 | 110 | 30 |
| departureDate | 360 | 525 | 105 | 30 |
| returnDate | 255 | 525 | 105 | 30 |
| stayDays | 155 | 525 | 100 | 30 |

### Section 2ב — Flight route

| Field | x | y | width | height | align |
|---|---|---|---|---|---|
| flightRoute | 25 | 413 | 545 | 32 | right |

### Section 3 — Commander

| Field | x | y | width | height |
|---|---|---|---|---|
| commanderPersonalNumber | 450 | 345 | 90 | 20 |
| commanderRank | 375 | 345 | 75 | 20 |
| commanderName | 225 | 345 | 150 | 20 |
| commanderDate | 125 | 345 | 100 | 20 |
| commanderSignature | 25 | 295 | 100 | 50 |

## Architecture

### Constants

```
MAX_FONT_SIZE = 12
MIN_FONT_SIZE = 8
```

`FONT_SIZE = 10` is removed.

### `pdfCoords.ts` — updated shape

```ts
export type FieldBox = {
  x: number
  y: number
  width: number
  height: number
  align?: 'left' | 'right'   // default: 'left'
}

export const COORDS: Record<string, FieldBox> = { ... }
```

`commanderSignature` retains its existing shape (image, not text).

### `src/lib/textFit.ts` — new module

```ts
import type { PDFFont } from 'pdf-lib'
import type { FieldBox } from './pdfCoords'

export type FitResult = {
  lines: string[]
  size: number
  drawX: number   // x of first character of each line (may differ per line for right-align)
  drawY: number   // y of first line baseline
  lineHeight: number
}

export function fitText(
  text: string,
  box: FieldBox,
  font: PDFFont,
  maxSize = MAX_FONT_SIZE,
  minSize = MIN_FONT_SIZE,
): FitResult
```

**Algorithm:**

```
Phase 1 — single-line shrink:
  for size in [maxSize .. minSize]:
    if font.widthOfTextAtSize(text, size) <= box.width:
      return singleLine(text, size, box)

Phase 2 — word-wrap shrink:
  for size in [maxSize .. minSize]:
    lines = wordWrap(text, box.width, font, size)
    lineHeight = size * 1.2
    if lines.length * lineHeight <= box.height:
      return multiLine(lines, size, box)

Phase 3 — best effort at minSize:
  lines = wordWrap(text, box.width, font, minSize)
  return multiLine(lines, minSize, box)   // may overflow
```

**`drawX` calculation:**
- `align='left'`:  `drawX = box.x`
- `align='right'`: `drawX = box.x + box.width - font.widthOfTextAtSize(line, size)`

**`drawY` calculation (first line baseline):**
- `drawY = box.y + box.height - size`
- Subsequent lines: `drawY -= lineHeight`

### `pdfFiller.ts` — updated draw helper

Replace fixed `draw(text, x, y)` with:

```ts
function drawFitted(text: string, field: keyof typeof COORDS) {
  const box = COORDS[field]
  const { lines, size, drawX, drawY, lineHeight } = fitText(text, box, rubikFont)
  lines.forEach((line, i) => {
    page.drawText(line, {
      x: box.align === 'right'
        ? box.x + box.width - rubikFont.widthOfTextAtSize(line, size)
        : drawX,
      y: drawY - i * lineHeight,
      size,
      font: rubikFont,
      color: textColor,
    })
  })
}
```

All existing `draw(formData.X, COORDS.X.x, COORDS.X.y)` calls become `drawFitted(formData.X, 'X')`.

## Files Changed

| File | Change |
|---|---|
| `src/lib/pdfCoords.ts` | Replace point coords with `FieldBox` structs; add `MAX_FONT_SIZE`, `MIN_FONT_SIZE` |
| `src/lib/textFit.ts` | New — fitting algorithm |
| `src/lib/pdfFiller.ts` | Replace `draw()` with `drawFitted()` using `textFit` |

## Calibration

Coordinates were measured from `calibration_output.pdf` (grid overlay on template). After implementation, generate a test PDF and visually verify all fields are within their boxes. Adjust box values in `pdfCoords.ts` as needed.

The `scripts/calibrate.mjs` script remains available for re-measurement.
