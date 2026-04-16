import { PDFDocument, rgb, Color } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { SoldierFormData, Platoon } from '../types'
import { calcDays } from './calcDays'
import { svgToPng } from './svgToPng'
import { COORDS, SIGNATURE_BOX } from './pdfCoords'
import { fitText } from './textFit'
import { getFontStyleOption } from './fontStyles'

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
  // Load template
  const templateUrl = import.meta.env.BASE_URL + 'fly_form_template.pdf'
  const existingPdfBytes = await fetch(templateUrl).then((r) => r.arrayBuffer())

  const pdfDoc = await PDFDocument.load(existingPdfBytes)
  pdfDoc.registerFontkit(fontkit)

  // Load the selected Hebrew font
  const fontUrl = import.meta.env.BASE_URL + getFontStyleOption(formData.fontStyle).assetPath
  const fontBytes = await fetch(fontUrl).then((r) => r.arrayBuffer())
  const selectedFont = await pdfDoc.embedFont(fontBytes)

  const pages = pdfDoc.getPages()
  const page = pages[0]

  const textColor = penColorToRgb(formData.penColor)

  function drawFitted(text: string, fieldName: keyof typeof COORDS) {
    if (!text) return
    const box = COORDS[fieldName]
    const { lines, size, drawX, drawY, lineHeight } = fitText(text, box, selectedFont)
    lines.forEach((line, i) => {
      const x = box.align === 'right'
        ? box.x + box.width - selectedFont.widthOfTextAtSize(line, size)
        : drawX
      page.drawText(line, {
        x,
        y: drawY - i * lineHeight,
        size,
        font: selectedFont,
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
  drawFitted(formData.destinationCountry,        'destinationCountry')
  drawFitted(formatDate(formData.departureDate), 'departureDate')
  drawFitted(formatDate(formData.returnDate),    'returnDate')
  const days = calcDays(formData.departureDate, formData.returnDate)
  drawFitted(days > 0 ? String(days) : '',       'stayDays')

  const flightRoute = formData.flightRouteStops.filter(Boolean).join(' - ')
  drawFitted(flightRoute, 'flightRoute')

  // Section 3 — Commander (from platoon config)
  const { commander } = platoon
  drawFitted(commander.personalNumber, 'commanderPersonalNumber')
  drawFitted(commander.rank,           'commanderRank')
  drawFitted(commander.name,           'commanderName')
  drawFitted(todayFormatted(),         'commanderDate')

  // Commander signature (SVG → PNG → embed)
  const sigPng = await svgToPng(commander.signatureSvg)
  const sigImage = await pdfDoc.embedPng(sigPng)
  const { x, y, width, height } = SIGNATURE_BOX
  page.drawImage(sigImage, { x, y, width, height })

  return pdfDoc.save()
}
