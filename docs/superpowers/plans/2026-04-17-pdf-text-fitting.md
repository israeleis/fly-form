# PDF Text Fitting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fixed-position text drawing in the PDF filler with box-aware text that auto-shrinks font size and word-wraps, and right-aligns the flight route field.

**Architecture:** `pdfCoords.ts` gains `FieldBox` structs with x/y/width/height for every field. A new `textFit.ts` module implements the shrink-then-wrap algorithm. `pdfFiller.ts` uses `drawFitted()` which delegates layout to `fitText()`.

**Tech Stack:** pdf-lib, TypeScript, Vitest

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `src/lib/pdfCoords.ts` | Replace point coords with FieldBox structs; export font size constants |
| Create | `src/lib/textFit.ts` | `fitText()` — shrink + wrap algorithm |
| Create | `src/lib/textFit.test.ts` | Unit tests for `fitText()` with a mock font |
| Modify | `src/lib/pdfFiller.ts` | Replace `draw()` with `drawFitted()` using `fitText()` |

---

## Task 1: Update `pdfCoords.ts` with FieldBox structs

**Files:**
- Modify: `src/lib/pdfCoords.ts`

- [ ] **Step 1: Replace the file contents**

Replace the entire file with:

```ts
// All coordinates are in pdf-lib points (origin: bottom-left of page).
// Measured from calibration_output.pdf grid overlay. Verify after implementation
// by generating a test PDF and comparing against the template.

export const MAX_FONT_SIZE = 12
export const MIN_FONT_SIZE = 8

export type FieldBox = {
  x: number
  y: number
  width: number
  height: number
  align?: 'left' | 'right'
}

export type SignatureBox = {
  x: number
  y: number
  width: number
  height: number
}

export const COORDS: Record<string, FieldBox> = {
  // Section 1 — Row 1
  personalNumber:   { x: 465, y: 660, width: 110, height: 35 },
  lastName:         { x: 365, y: 660, width: 100, height: 35 },
  firstName:        { x: 265, y: 660, width: 100, height: 35 },
  rank:             { x: 175, y: 660, width:  90, height: 35 },
  travelPurpose:    { x:  25, y: 660, width: 150, height: 35 },

  // Section 1 — Row 2 (contact person)
  contactLastName:  { x: 365, y: 600, width: 100, height: 35 },
  contactFirstName: { x: 265, y: 600, width: 100, height: 35 },
  contactAddress:   { x: 130, y: 600, width: 135, height: 35 },
  contactPhone:     { x:  25, y: 600, width: 105, height: 35 },

  // Section 2 — Trip details
  destinationCountry: { x: 465, y: 525, width: 110, height: 30 },
  departureDate:      { x: 360, y: 525, width: 105, height: 30 },
  returnDate:         { x: 255, y: 525, width: 105, height: 30 },
  stayDays:           { x: 155, y: 525, width: 100, height: 30 },

  // Section 2b — Flight route (right-aligned, supports multiline)
  flightRoute: { x: 25, y: 413, width: 545, height: 32, align: 'right' },

  // Section 3 — Commander details
  commanderPersonalNumber: { x: 450, y: 345, width:  90, height: 20 },
  commanderRank:           { x: 375, y: 345, width:  75, height: 20 },
  commanderName:           { x: 225, y: 345, width: 150, height: 20 },
  commanderDate:           { x: 125, y: 345, width: 100, height: 20 },
}

export const SIGNATURE_BOX: SignatureBox = { x: 25, y: 295, width: 100, height: 50 }
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors related to `pdfCoords.ts` (there will be errors in `pdfFiller.ts` since it still references the old shape — that's expected and will be fixed in Task 3).

- [ ] **Step 3: Commit**

```bash
git add src/lib/pdfCoords.ts
git commit -m "refactor: replace point coords with FieldBox structs in pdfCoords"
```

---

## Task 2: Implement `textFit.ts` with TDD

**Files:**
- Create: `src/lib/textFit.ts`
- Create: `src/lib/textFit.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/textFit.test.ts`:

```ts
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
    // Each word = 5 chars × 8 × 0.6 = 24 — fits in width=100 (4 words per line = 96+spaces)
    // "one two three four five" — long enough to force wrap
    const text = 'aaa bbb ccc ddd eee fff ggg'
    // At size 12: full text = 27 chars × 12 × 0.6 = 194.4 > 100 → wrap
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
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
npm test -- textFit
```

Expected: all tests fail with "Cannot find module './textFit'"

- [ ] **Step 3: Implement `textFit.ts`**

Create `src/lib/textFit.ts`:

```ts
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

function drawX(line: string, box: FieldBox, font: PDFFont, size: number): number {
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
        drawX: drawX(text, box, font, size),
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
        drawX: drawX(lines[0], box, font, size),
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
    drawX: drawX(lines[0], box, font, size),
    drawY: box.y + box.height - size,
    lineHeight,
  }
}
```

- [ ] **Step 4: Run tests — verify they pass**

```bash
npm test -- textFit
```

Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add src/lib/textFit.ts src/lib/textFit.test.ts
git commit -m "feat: add textFit utility with shrink and word-wrap algorithm"
```

---

## Task 3: Update `pdfFiller.ts` to use `drawFitted`

**Files:**
- Modify: `src/lib/pdfFiller.ts`

- [ ] **Step 1: Replace the file contents**

```ts
import { PDFDocument, rgb, Color } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { SoldierFormData, Platoon } from '../types'
import { calcDays } from './calcDays'
import { svgToPng } from './svgToPng'
import { COORDS, SIGNATURE_BOX } from './pdfCoords'
import { fitText } from './textFit'

function formatDate(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function todayFormatted(): string {
  const now = new Date()
  const d = String(now.getDate()).padStart(2, '0')
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const y = now.getFullYear()
  return `${d}/${m}/${y}`
}

function penColorToRgb(penColor: SoldierFormData['penColor']): Color {
  if (penColor === 'dark-blue') return rgb(0.05, 0.10, 0.45)
  if (penColor === 'blue')      return rgb(0.10, 0.38, 0.82)
  return rgb(0, 0, 0)
}

export async function fillPdf(
  formData: SoldierFormData,
  platoon: Platoon
): Promise<Uint8Array> {
  const templateUrl = import.meta.env.BASE_URL + 'fly_form_template.pdf'
  const existingPdfBytes = await fetch(templateUrl).then((r) => r.arrayBuffer())

  const pdfDoc = await PDFDocument.load(existingPdfBytes)
  pdfDoc.registerFontkit(fontkit)

  const fontUrl = import.meta.env.BASE_URL + 'Rubik-Regular.ttf'
  const fontBytes = await fetch(fontUrl).then((r) => r.arrayBuffer())
  const rubikFont = await pdfDoc.embedFont(fontBytes)

  const pages = pdfDoc.getPages()
  const page = pages[0]
  const textColor = penColorToRgb(formData.penColor)

  function drawFitted(text: string, fieldName: keyof typeof COORDS) {
    if (!text) return
    const box = COORDS[fieldName]
    const { lines, size, drawX, drawY, lineHeight } = fitText(text, box, rubikFont)
    lines.forEach((line, i) => {
      const x = box.align === 'right'
        ? box.x + box.width - rubikFont.widthOfTextAtSize(line, size)
        : drawX
      page.drawText(line, {
        x,
        y: drawY - i * lineHeight,
        size,
        font: rubikFont,
        color: textColor,
      })
    })
  }

  // Section 1
  drawFitted(formData.personalNumber, 'personalNumber')
  drawFitted(formData.lastName,       'lastName')
  drawFitted(formData.firstName,      'firstName')
  drawFitted(formData.rank,           'rank')
  drawFitted(formData.travelPurpose,  'travelPurpose')

  const contactAddress = [formData.contactStreet, formData.contactHouseNumber, formData.contactCity]
    .filter(Boolean).join(' ')
  drawFitted(formData.contactLastName,  'contactLastName')
  drawFitted(formData.contactFirstName, 'contactFirstName')
  drawFitted(contactAddress,            'contactAddress')
  drawFitted(formData.contactPhone,     'contactPhone')

  // Section 2
  drawFitted(formData.destinationCountry,          'destinationCountry')
  drawFitted(formatDate(formData.departureDate),   'departureDate')
  drawFitted(formatDate(formData.returnDate),      'returnDate')
  const days = calcDays(formData.departureDate, formData.returnDate)
  drawFitted(days > 0 ? String(days) : '',         'stayDays')

  const flightRoute = formData.flightRouteStops.filter(Boolean).join(' - ')
  drawFitted(flightRoute, 'flightRoute')

  // Section 3 — Commander
  const { commander } = platoon
  drawFitted(commander.personalNumber, 'commanderPersonalNumber')
  drawFitted(commander.rank,           'commanderRank')
  drawFitted(commander.name,           'commanderName')
  drawFitted(todayFormatted(),         'commanderDate')

  // Commander signature
  const sigPng = await svgToPng(commander.signatureSvg)
  const sigImage = await pdfDoc.embedPng(sigPng)
  const { x, y, width, height } = SIGNATURE_BOX
  page.drawImage(sigImage, { x, y, width, height })

  return pdfDoc.save()
}
```

- [ ] **Step 2: Verify TypeScript compiles cleanly**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add src/lib/pdfFiller.ts
git commit -m "feat: use box-aware drawFitted with font shrink and word-wrap in pdfFiller"
```

---

## Task 4: Visual verification

**Files:** none (manual check)

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Fill out the form and generate a PDF**

Open the app, fill all fields (use a long value like "אמריקה הצפונית" for destination, and a multi-stop flight route like "TLV - AMS - JFK - LAX - SYD"), download the PDF.

- [ ] **Step 3: Check each field visually**

Open the generated PDF alongside `public/fly_form_template.pdf`. Verify:
- All text is within its box
- Flight route is right-aligned
- Long values shrink or wrap without overflowing
- No field is misaligned relative to the template

- [ ] **Step 4: Tune coordinates if needed**

If any field is off, adjust the values in `src/lib/pdfCoords.ts` and regenerate. Commit any coordinate fixes:

```bash
git add src/lib/pdfCoords.ts
git commit -m "fix: calibrate field box coordinates after visual verification"
```
