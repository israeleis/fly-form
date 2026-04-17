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
  maxSize?: number
  preferWrap?: boolean
  maxLines?: number
}

export type SignatureBox = {
  x: number
  y: number
  width: number
  height: number
}

export const COORDS: Record<string, FieldBox> = {
  // Section 1 — Row 1
  personalNumber:   { x: 405, y: 660, width: 85, height: 32 },
  lastName:         { x: 320, y: 660, width: 85, height: 32 },
  firstName:        { x: 240, y: 660, width: 80, height: 32 },
  rank:             { x: 140, y: 660, width: 100, height: 32 },
  travelPurpose:    { x:  17, y: 660, width: 123, height: 32 },

  // Section 1 — Row 2 (contact person)
  contactLastName:  { x: 320, y: 605, width: 85, height: 32 },
  contactFirstName: { x: 240, y: 605, width: 80, height: 32 },
  contactAddress:   { x: 140, y: 605, width: 100, height: 32, preferWrap: true, maxLines: 2 },
  contactPhone:     { x:  17, y: 605, width: 123, height: 32 },

  // Section 2 — Trip details
  destinationCountry: { x: 422, y: 512, width: 70, height: 32 },
  departureDate:      { x: 306, y: 512, width: 116, height: 32 },
  returnDate:         { x: 206, y: 512, width: 100, height: 32 },
  stayDays:           { x: 113, y: 512, width: 93, height: 32 },

  // Section 2b — Flight route (right-aligned, supports multiline)
  flightRoute: { x: 85, y: 418, width: 430, height: 35, align: 'right', maxLines: 2 },

  // Section 3 — Commander details
  // These fields sit inside the underline gaps, not on top of the printed labels.
  commanderPersonalNumber: { x: 385, y: 318, width: 72,  height: 18, align: 'right', maxSize: 10 },
  commanderRank:           { x: 328, y: 318, width: 58,  height: 18, align: 'right', maxSize: 10 },
  commanderName:           { x: 210, y: 318, width: 118, height: 18, align: 'right', maxSize: 10 },
  commanderDate:           { x: 145, y: 318, width: 85,  height: 18, align: 'right', maxSize: 10 },
}

export const SIGNATURE_BOX: SignatureBox = { x: 25, y: 295, width: 100, height: 50 }
