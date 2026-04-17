import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { readFileSync, writeFileSync } from 'fs'

const LRM = '\u200E'
const RLM = '\u200F'
const LRE = '\u202A'
const RLE = '\u202B'
const PDF = '\u202C'
const LRI = '\u2066'
const RLI = '\u2067'
const PDI = '\u2069'

const samples = [
  ['plain', 'המעלות 13 קרית ים'],
  ['plain-reversed-run', 'המעלות 31 קרית ים'],
  ['lrm-wrap', `המעלות ${LRM}13${LRM} קרית ים`],
  ['rlm-wrap', `המעלות ${RLM}13${RLM} קרית ים`],
  ['lre-wrap', `המעלות ${LRE}13${PDF} קרית ים`],
  ['rle-whole', `${RLE}המעלות 13 קרית ים${PDF}`],
  ['lri-wrap', `המעלות ${LRI}13${PDI} קרית ים`],
  ['rli-wrap', `המעלות ${RLI}13${PDI} קרית ים`],
  ['number-first', '13 המעלות קרית ים'],
  ['number-first-reversed-run', '31 המעלות קרית ים'],
  ['phone', '052-4561238'],
  ['phone-reversed-run', '8321654-250'],
  ['date', '23/04/2026'],
  ['date-reversed-run', '6202/40/32'],
  ['manual-break', 'המעלות 13 קרית\nים'],
]

const pdfDoc = await PDFDocument.create()
pdfDoc.registerFontkit(fontkit)
const page = pdfDoc.addPage([700, 500])
const labelFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
const fontBytes = readFileSync('public/Rubik-Regular.ttf')
const hebrewFont = await pdfDoc.embedFont(fontBytes)

let y = 460
for (const [label, sample] of samples) {
  page.drawText(label, { x: 20, y, size: 10, font: labelFont, color: rgb(0.8, 0, 0) })
  page.drawRectangle({
    x: 140,
    y: y - 8,
    width: 260,
    height: 28,
    borderWidth: 1,
    borderColor: rgb(0, 0, 0),
  })
  page.drawText(sample, {
    x: 145,
    y,
    size: 14,
    font: hebrewFont,
    color: rgb(0, 0.2, 0.8),
    lineHeight: 16,
  })
  y -= 46
}

writeFileSync('/tmp/bidi-debug.pdf', await pdfDoc.save())
console.log('Wrote /tmp/bidi-debug.pdf')
