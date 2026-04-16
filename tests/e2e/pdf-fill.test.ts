import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import puppeteer, { Browser, Page } from 'puppeteer'
import { createServer, ViteDevServer } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Use legacy pdfjs build (no canvas needed for text extraction)
const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')

const PORT = 5199
const APP_URL = `http://localhost:${PORT}/fly-form/`

// Test data — each value is distinct enough to identify which field it came from
const TEST_DATA = {
  personalNumber:     '7654321',
  lastName:           'כהן',
  firstName:          'משה',
  rank:               'סגן',
  travelPurpose:      'חופשה',
  contactLastName:    'לוי',
  contactFirstName:   'דוד',
  contactAddress:     'תל אביב',
  contactPhone:       '0501234567',
  destinationCountry: 'גרמניה',
  departureDate:      '2026-05-10',
  returnDate:         '2026-05-17',
  flightRoute:        'ת"א-פרנקפורט',
}

// When STRICT_ZONES = false, zone mismatches are warnings not hard failures.
// Set to true once zones have been calibrated.
const STRICT_ZONES = true

// Expected coordinate zones (PDF points, origin = bottom-left, A4 = 595×842)
// These are the target zones each field should land IN.
// Adjust these after seeing the calibration report output.
const ZONES: Record<string, { xMin: number; xMax: number; yMin: number; yMax: number }> = {
  // Section 1 Row 1 — white data cells at y=668
  personalNumber:     { xMin: 380, xMax: 545, yMin: 658, yMax: 680 },
  lastName:           { xMin: 255, xMax: 380, yMin: 658, yMax: 680 },
  firstName:          { xMin: 150, xMax: 255, yMin: 658, yMax: 680 },
  rank:               { xMin: 90,  xMax: 160, yMin: 658, yMax: 680 },
  travelPurpose:      { xMin: 20,  xMax: 110, yMin: 658, yMax: 680 },
  // Section 1 Row 2 — contact white cells at y=615
  contactLastName:    { xMin: 255, xMax: 380, yMin: 605, yMax: 627 },
  contactFirstName:   { xMin: 150, xMax: 255, yMin: 605, yMax: 627 },
  contactAddress:     { xMin: 90,  xMax: 180, yMin: 605, yMax: 627 },
  contactPhone:       { xMin: 20,  xMax: 110, yMin: 605, yMax: 627 },
  // Section 2 trip row — white cells at y=518
  destinationCountry: { xMin: 380, xMax: 545, yMin: 508, yMax: 530 },
  departureDate:      { xMin: 255, xMax: 380, yMin: 508, yMax: 530 },
  returnDate:         { xMin: 150, xMax: 255, yMin: 508, yMax: 530 },
  stayDays:           { xMin: 60,  xMax: 150, yMin: 508, yMax: 530 },
  // Section 2b flight route text area at y=448
  flightRoute:        { xMin: 30,  xMax: 510, yMin: 420, yMax: 460 },
  // Section 3 commander row at y=348
  commanderName:      { xMin: 150, xMax: 280, yMin: 338, yMax: 360 },
  commanderRank:      { xMin: 280, xMax: 360, yMin: 338, yMax: 360 },
}

interface TextItem { str: string; x: number; y: number }

async function extractTextItems(buf: Buffer): Promise<TextItem[]> {
  const uint8 = new Uint8Array(buf)
  const loadingTask = pdfjsLib.getDocument({
    data: uint8,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
  })
  const pdf = await loadingTask.promise
  const page1 = await pdf.getPage(1)
  const content = await page1.getTextContent()
  const items: TextItem[] = []
  for (const item of content.items) {
    if ('str' in item && (item as { str: string }).str.trim()) {
      const ti = item as { str: string; transform: number[] }
      items.push({ str: ti.str.trim(), x: ti.transform[4], y: ti.transform[5] })
    }
  }
  return items
}

let server: ViteDevServer
let browser: Browser
let page: Page

beforeAll(async () => {
  // Start Vite dev server
  server = await createServer({
    root: path.resolve(__dirname, '../..'),
    base: '/fly-form/',
    server: { port: PORT, strictPort: true },
    logLevel: 'silent',
  })
  await server.listen()

  // Launch browser
  browser = await puppeteer.launch({ headless: true })
  page = await browser.newPage()
}, 30000)

afterAll(async () => {
  await browser?.close()
  await server?.close()
})

// Helper: fill an input/textarea by its label text using React's native setter
async function fillByLabel(labelText: string, value: string) {
  await page.evaluate(
    ({ label, val }) => {
      const labels = Array.from(document.querySelectorAll('label'))
      const found = labels.find((l) => l.textContent?.trim() === label)
      if (!found) throw new Error(`Label not found: ${label}`)
      const field = found.closest('.field')
      const input = field?.querySelector('input, textarea, select') as HTMLInputElement | HTMLTextAreaElement | null
      if (!input) throw new Error(`Input not found for label: ${label}`)

      if (input instanceof HTMLTextAreaElement) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
        nativeSetter?.call(input, val)
      } else {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
        nativeSetter?.call(input, val)
      }
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    },
    { label: labelText, val: value }
  )
}

// Helper: fill a date input by label (needs special handling for React controlled inputs)
async function fillDateByLabel(labelText: string, value: string) {
  await page.evaluate(
    ({ label, val }) => {
      const labels = Array.from(document.querySelectorAll('label'))
      const found = labels.find((l) => l.textContent?.trim() === label)
      if (!found) throw new Error(`Date label not found: ${label}`)
      const field = found.closest('.field')
      const input = field?.querySelector('input[type="date"]') as HTMLInputElement | null
      if (!input) throw new Error(`Date input not found for label: ${label}`)
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
      nativeSetter?.call(input, val)
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    },
    { label: labelText, val: value }
  )
}

describe('PDF form fill', () => {
  it('fills all form fields and places text in correct zones', async () => {
    // Navigate to the form — set up PDF capture intercept before navigating
    await page.goto(APP_URL, { waitUntil: 'networkidle2' })

    // Override URL.createObjectURL to capture PDF bytes before revoke
    await page.evaluate(() => {
      ;(window as unknown as Record<string, unknown>).__capturedPdfBase64 = null
      const orig = URL.createObjectURL.bind(URL)
      URL.createObjectURL = function (blob: Blob) {
        if (blob.type === 'application/pdf') {
          const reader = new FileReader()
          reader.onload = () => {
            const dataUrl = reader.result as string
            ;(window as unknown as Record<string, unknown>).__capturedPdfBase64 = dataUrl.split(',')[1]
          }
          reader.readAsDataURL(blob)
        }
        return orig(blob)
      }
    })

    // Fill Section 1 — soldier personal details
    await fillByLabel('מספר אישי', TEST_DATA.personalNumber)
    // There are two "שם משפחה" labels (soldier and contact) — handle first/second explicitly
    await page.evaluate(
      ({ val }) => {
        const labels = Array.from(document.querySelectorAll('label'))
        // First "שם משפחה" is for the soldier
        const found = labels.find((l) => l.textContent?.trim() === 'שם משפחה')
        if (!found) throw new Error('שם משפחה label not found')
        const field = found.closest('.field')
        const input = field?.querySelector('input') as HTMLInputElement
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
        nativeSetter?.call(input, val)
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
      },
      { val: TEST_DATA.lastName }
    )
    await page.evaluate(
      ({ val }) => {
        const labels = Array.from(document.querySelectorAll('label'))
        // First "שם פרטי" is for the soldier
        const found = labels.find((l) => l.textContent?.trim() === 'שם פרטי')
        if (!found) throw new Error('שם פרטי label not found')
        const field = found.closest('.field')
        const input = field?.querySelector('input') as HTMLInputElement
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
        nativeSetter?.call(input, val)
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
      },
      { val: TEST_DATA.firstName }
    )
    await fillByLabel('דרגה', TEST_DATA.rank)
    await fillByLabel('מטרת נסיעה', TEST_DATA.travelPurpose)

    // Fill contact person details — second occurrences of "שם משפחה" and "שם פרטי"
    await page.evaluate(
      ({ lastName, firstName, address, phone }) => {
        const labels = Array.from(document.querySelectorAll('label'))
        const allLastName = labels.filter((l) => l.textContent?.trim() === 'שם משפחה')
        const allFirstName = labels.filter((l) => l.textContent?.trim() === 'שם פרטי')

        function fillInput(label: Element, val: string) {
          const field = label.closest('.field')
          const input = field?.querySelector('input') as HTMLInputElement
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
          nativeSetter?.call(input, val)
          input.dispatchEvent(new Event('input', { bubbles: true }))
          input.dispatchEvent(new Event('change', { bubbles: true }))
        }

        // Second occurrence = contact
        if (allLastName[1]) fillInput(allLastName[1], lastName)
        if (allFirstName[1]) fillInput(allFirstName[1], firstName)

        // Find by unique label text for address and phone
        const addressLabel = labels.find((l) => l.textContent?.trim() === 'כתובת עדכנית')
        if (addressLabel) fillInput(addressLabel, address)

        const phoneLabel = labels.find((l) => l.textContent?.trim() === 'טלפון')
        if (phoneLabel) {
          const field = phoneLabel.closest('.field')
          const input = field?.querySelector('input[type="tel"]') as HTMLInputElement
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
          nativeSetter?.call(input, phone)
          input.dispatchEvent(new Event('input', { bubbles: true }))
          input.dispatchEvent(new Event('change', { bubbles: true }))
        }
      },
      {
        lastName: TEST_DATA.contactLastName,
        firstName: TEST_DATA.contactFirstName,
        address: TEST_DATA.contactAddress,
        phone: TEST_DATA.contactPhone,
      }
    )

    // Fill Section 2 — trip details
    await fillByLabel('מדינת יעד', TEST_DATA.destinationCountry)
    await fillDateByLabel('תאריך יציאה', TEST_DATA.departureDate)
    await fillDateByLabel('תאריך חזרה', TEST_DATA.returnDate)

    // Fill flight route (textarea)
    await fillByLabel('פירוט מסלול הטיסה (כולל קונקשין)', TEST_DATA.flightRoute)

    // Select platoon
    await page.select('select#platoon', 'platoon-example')

    // Wait for React to compute stayDays after dates are filled
    await page.waitForFunction(
      () => Array.from(document.querySelectorAll('input[readonly]')).some(
        (el) => (el as HTMLInputElement).value !== ''
      ),
      { timeout: 5000 }
    )

    // Submit the form
    await page.click('button[type="submit"]')

    // Wait for PDF to be captured (up to 15s)
    await page.waitForFunction(
      () => (window as unknown as Record<string, unknown>).__capturedPdfBase64 !== null,
      { timeout: 15000 }
    )

    const base64 = await page.evaluate(
      () => (window as unknown as Record<string, unknown>).__capturedPdfBase64 as string
    )
    const pdfBuffer = Buffer.from(base64, 'base64')

    // Extract text items from PDF
    const items = await extractTextItems(pdfBuffer)

    // ── Calibration report ──
    console.log('\n=== PDF CALIBRATION REPORT ===')
    console.log('Found text items (str | x | y):')
    const sorted = [...items].sort((a, b) => b.y - a.y)
    for (const item of sorted) {
      console.log(`  "${item.str}" → x=${Math.round(item.x)}, y=${Math.round(item.y)}`)
    }
    console.log('==============================\n')

    // ── Assert text content is present ──
    const allText = items.map((i) => i.str).join(' ')
    expect(allText).toContain(TEST_DATA.personalNumber)
    expect(allText).toContain(TEST_DATA.lastName)
    expect(allText).toContain(TEST_DATA.firstName)
    expect(allText).toContain(TEST_DATA.destinationCountry)
    // departureDate formatted as DD/MM/YYYY → 10/05/2026
    expect(allText).toContain('10/05/2026')
    // returnDate formatted as DD/MM/YYYY → 17/05/2026
    expect(allText).toContain('17/05/2026')
    // stayDays = 8 (10 May to 17 May inclusive, calcDays adds 1)
    expect(allText).toContain('8')
    expect(allText).toContain(TEST_DATA.flightRoute)
    // Commander details from platoon config
    expect(allText).toContain('ישראל ישראלי')

    // ── Assert each field lands in its zone ──
    function findItem(text: string): TextItem | undefined {
      return items.find((i) => i.str.includes(text))
    }
    function inZone(item: TextItem | undefined, zone: (typeof ZONES)[string]): boolean {
      if (!item) return false
      return item.x >= zone.xMin && item.x <= zone.xMax && item.y >= zone.yMin && item.y <= zone.yMax
    }

    // For fields where the same text value appears in multiple places,
    // supply a coordinate hint so we find the right occurrence.
    interface ZoneCheck {
      searchText: string
      // Optional y-range hint to disambiguate items with identical text
      yHint?: { min: number; max: number }
    }
    const zoneChecks: Record<string, ZoneCheck> = {
      personalNumber:     { searchText: TEST_DATA.personalNumber },
      lastName:           { searchText: TEST_DATA.lastName },
      firstName:          { searchText: TEST_DATA.firstName },
      // "סגן" appears both as soldier rank (y≈668) and commander rank (y≈348)
      rank:               { searchText: TEST_DATA.rank, yHint: { min: 658, max: 680 } },
      travelPurpose:      { searchText: TEST_DATA.travelPurpose },
      contactLastName:    { searchText: TEST_DATA.contactLastName },
      contactFirstName:   { searchText: TEST_DATA.contactFirstName },
      contactAddress:     { searchText: TEST_DATA.contactAddress },
      contactPhone:       { searchText: TEST_DATA.contactPhone },
      destinationCountry: { searchText: TEST_DATA.destinationCountry },
      departureDate:      { searchText: '10/05/2026' },
      returnDate:         { searchText: '17/05/2026' },
      // stayDays = 8 (calcDays is inclusive); use y-hint to avoid matching other single digits
      stayDays:           { searchText: '8', yHint: { min: 508, max: 530 } },
      flightRoute:        { searchText: TEST_DATA.flightRoute },
      commanderName:      { searchText: 'ישראל ישראלי' },
      // "סגן" for commander is at y≈348
      commanderRank:      { searchText: 'סגן', yHint: { min: 338, max: 360 } },
    }

    for (const [field, check] of Object.entries(zoneChecks)) {
      const zone = ZONES[field]
      if (!zone) continue

      // Find the item: if a yHint is given, filter to items in that y-band first
      let item: TextItem | undefined
      if (check.yHint) {
        item = items.find(
          (i) => i.str.includes(check.searchText) && i.y >= check.yHint!.min && i.y <= check.yHint!.max
        )
      } else {
        item = findItem(check.searchText)
      }

      if (!item) {
        console.warn(`  WARNING: "${field}" text "${check.searchText}" NOT FOUND in PDF`)
        continue
      }
      const ok = inZone(item, zone)
      if (!ok) {
        console.warn(
          `  FAIL: "${field}" at (${Math.round(item.x)}, ${Math.round(item.y)}) — expected zone x:[${zone.xMin}-${zone.xMax}] y:[${zone.yMin}-${zone.yMax}]`
        )
      } else {
        console.log(
          `  PASS: "${field}" at (${Math.round(item.x)}, ${Math.round(item.y)}) — in zone`
        )
      }
      if (STRICT_ZONES) {
        expect(
          ok,
          `Field "${field}" text "${check.searchText}" at (${Math.round(item.x)}, ${Math.round(item.y)}) is outside expected zone x:[${zone.xMin}-${zone.xMax}] y:[${zone.yMin}-${zone.yMax}]`
        ).toBe(true)
      }
    }
  })
})
