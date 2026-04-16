import { PDFDocument, rgb, Color } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import { SoldierFormData, Platoon } from '../types'
import { calcDays } from './calcDays'
import { svgToPng } from './svgToPng'
import { COORDS, FONT_SIZE } from './pdfCoords'

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

  // Load Hebrew font
  const fontUrl = import.meta.env.BASE_URL + 'Rubik-Regular.ttf'
  const fontBytes = await fetch(fontUrl).then((r) => r.arrayBuffer())
  const rubikFont = await pdfDoc.embedFont(fontBytes)

  const pages = pdfDoc.getPages()
  const page = pages[0]

  const textColor = penColorToRgb(formData.penColor)

  const draw = (text: string, x: number, y: number) => {
    page.drawText(text, {
      x,
      y,
      size: FONT_SIZE,
      font: rubikFont,
      color: textColor,
    })
  }

  // Section 1
  draw(formData.personalNumber, COORDS.personalNumber.x, COORDS.personalNumber.y)
  draw(formData.lastName,       COORDS.lastName.x,       COORDS.lastName.y)
  draw(formData.firstName,      COORDS.firstName.x,      COORDS.firstName.y)
  draw(formData.rank,           COORDS.rank.x,           COORDS.rank.y)
  draw(formData.travelPurpose,  COORDS.travelPurpose.x,  COORDS.travelPurpose.y)

  const contactAddress = [formData.contactStreet, formData.contactHouseNumber, formData.contactCity]
    .filter(Boolean).join(' ')
  draw(formData.contactLastName,  COORDS.contactLastName.x,  COORDS.contactLastName.y)
  draw(formData.contactFirstName, COORDS.contactFirstName.x, COORDS.contactFirstName.y)
  draw(contactAddress,            COORDS.contactAddress.x,   COORDS.contactAddress.y)
  draw(formData.contactPhone,     COORDS.contactPhone.x,     COORDS.contactPhone.y)

  // Section 2
  draw(formData.destinationCountry, COORDS.destinationCountry.x, COORDS.destinationCountry.y)
  draw(formatDate(formData.departureDate), COORDS.departureDate.x, COORDS.departureDate.y)
  draw(formatDate(formData.returnDate),    COORDS.returnDate.x,    COORDS.returnDate.y)
  const days = calcDays(formData.departureDate, formData.returnDate)
  draw(days > 0 ? String(days) : '', COORDS.stayDays.x, COORDS.stayDays.y)
  const flightRoute = formData.flightRouteStops.filter(Boolean).join(' - ')
  draw(flightRoute, COORDS.flightRoute.x, COORDS.flightRoute.y)

  // Section 3 — Commander (from platoon config)
  const { commander } = platoon
  draw(commander.personalNumber, COORDS.commanderPersonalNumber.x, COORDS.commanderPersonalNumber.y)
  draw(commander.rank,           COORDS.commanderRank.x,           COORDS.commanderRank.y)
  draw(commander.name,           COORDS.commanderName.x,           COORDS.commanderName.y)
  draw(todayFormatted(),         COORDS.commanderDate.x,           COORDS.commanderDate.y)

  // Commander signature (SVG → PNG → embed)
  const sigPng = await svgToPng(commander.signatureSvg)
  const sigImage = await pdfDoc.embedPng(sigPng)
  const { x, y, width, height } = COORDS.commanderSignature
  page.drawImage(sigImage, { x, y, width, height })

  return pdfDoc.save()
}
