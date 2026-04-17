// Calibration script: overlays a coordinate grid on the PDF template.
// Run with: node scripts/calibrate.mjs
// Output: calibration_output.pdf — open it alongside the template to read box coords.

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { readFileSync, writeFileSync } from 'fs'

function extractObjectLiteral(source, exportName, nextExportName) {
  const pattern = new RegExp(
    `export const ${exportName}(?::[^=]+)? = (\\{[\\s\\S]*?\\})\\n\\nexport const ${nextExportName}`,
  )
  const match = source.match(pattern)
  if (!match) {
    throw new Error(`Could not find export ${exportName} in src/lib/pdfCoords.ts`)
  }
  return match[1]
}

function loadCoordsFromSource() {
  const source = readFileSync('src/lib/pdfCoords.ts', 'utf8')
  const coordsLiteral = extractObjectLiteral(source, 'COORDS', 'SIGNATURE_BOX')
  return Function(`"use strict"; return (${coordsLiteral});`)()
}

const templateBytes = readFileSync('public/fly_form_template.pdf')
const pdfDoc = await PDFDocument.load(templateBytes)
const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

const page = pdfDoc.getPages()[0]
const { width, height } = page.getSize()

console.log(`Page size: ${width} x ${height} pts`)

const STEP = 50
const LABEL_SIZE = 6
const GRID_COLOR = rgb(0.8, 0.1, 0.1)
const LABEL_COLOR = rgb(0.0, 0.0, 0.8)

// Vertical lines (x axis)
for (let x = 0; x <= width; x += STEP) {
  page.drawLine({
    start: { x, y: 0 },
    end:   { x, y: height },
    thickness: 0.3,
    color: GRID_COLOR,
    opacity: 0.5,
  })
  // Label at bottom and top
  page.drawText(String(x), {
    x: x + 1,
    y: 4,
    size: LABEL_SIZE,
    font,
    color: LABEL_COLOR,
  })
  page.drawText(String(x), {
    x: x + 1,
    y: height - LABEL_SIZE - 2,
    size: LABEL_SIZE,
    font,
    color: LABEL_COLOR,
  })
}

// Horizontal lines (y axis)
for (let y = 0; y <= height; y += STEP) {
  page.drawLine({
    start: { x: 0,     y },
    end:   { x: width, y },
    thickness: 0.3,
    color: GRID_COLOR,
    opacity: 0.5,
  })
  // Label at left and right
  page.drawText(String(y), {
    x: 2,
    y: y + 1,
    size: LABEL_SIZE,
    font,
    color: LABEL_COLOR,
  })
  page.drawText(String(y), {
    x: width - 18,
    y: y + 1,
    size: LABEL_SIZE,
    font,
    color: LABEL_COLOR,
  })
}

// Also draw finer 10pt tick marks along the edges for precision
const FINE_STEP = 10
const TICK_LEN = 4
for (let x = 0; x <= width; x += FINE_STEP) {
  if (x % STEP !== 0) {
    page.drawLine({
      start: { x, y: 0 },
      end:   { x, y: TICK_LEN },
      thickness: 0.3,
      color: GRID_COLOR,
      opacity: 0.4,
    })
    page.drawLine({
      start: { x, y: height - TICK_LEN },
      end:   { x, y: height },
      thickness: 0.3,
      color: GRID_COLOR,
      opacity: 0.4,
    })
  }
}
for (let y = 0; y <= height; y += FINE_STEP) {
  if (y % STEP !== 0) {
    page.drawLine({
      start: { x: 0,        y },
      end:   { x: TICK_LEN, y },
      thickness: 0.3,
      color: GRID_COLOR,
      opacity: 0.4,
    })
    page.drawLine({
      start: { x: width - TICK_LEN, y },
      end:   { x: width,            y },
      thickness: 0.3,
      color: GRID_COLOR,
      opacity: 0.4,
    })
  }
}

// Draw current field boxes in red so we can see where they land
const COORDS = loadCoordsFromSource()

const BOX_COLOR = rgb(0.85, 0.1, 0.1)
const BOX_TEXT_COLOR = rgb(0.75, 0.0, 0.0)

for (const [name, box] of Object.entries(COORDS)) {
  page.drawRectangle({
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    borderColor: BOX_COLOR,
    borderWidth: 1,
    opacity: 0,
    borderOpacity: 0.8,
  })
  // Label the box
  page.drawText(name, {
    x: box.x + 1,
    y: box.y + box.height - 6,
    size: 4,
    font,
    color: BOX_TEXT_COLOR,
  })
}

const outBytes = await pdfDoc.save()
writeFileSync('calibration_output.pdf', outBytes)
console.log('Written: calibration_output.pdf')
console.log('Red rectangles = current field boxes. Adjust coords in pdfCoords.ts to match template cells.')
