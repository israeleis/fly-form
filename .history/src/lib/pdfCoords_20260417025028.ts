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
  personalNumber:   { x: 425, y: 658, width: 110, height: 35 },
  lastName:         { x: 345, y: 658, width: 100, height: 35 },
  firstName:        { x: 270, y: 660, width: 100, height: 35 },
  rank:             { x: 175, y: 660, width:  110, height: 35 },
  travelPurpose:    { x:  55, y: 660, width: 150, height: 35 },

  // Section 1 — Row 2 (contact person)
  contactLastName:  { x: 345, y: 605, width: 100, height: 35 },
  contactFirstName: { x: 270, y: 605, width: 100, height: 35 },
  contactAddress:   { x: 140, y: 605, width: 80, height: 35, preferWrap: true, maxLines: 2 },
  contactPhone:     { x:  55, y: 605, width: 150, height: 35 },

  // Section 2 — Trip details
  destinationCountry: { x: 435, y: 518, width: 110, height: 30 },
  departureDate:      { x: 330, y: 518, width: 105, height: 30 },
  returnDate:         { x: 235, y: 518, width: 105, height: 30 },
  stayDays:           { x: 155, y: 518, width: 100, height: 30 },

  // Section 2b — Flight route (right-aligned, supports multiline)
  flightRoute: { x: 25, y: 413, width: 485, height: 32, align: 'right' },

  // Section 3 — Commander details
  // These fields sit inside the underline gaps, not on top of the printed labels.
  commanderPersonalNumber: { x: 385, y: 318, width: 72,  height: 18, align: 'right', maxSize: 10 },
  commanderRank:           { x: 328, y: 318, width: 58,  height: 18, align: 'right', maxSize: 10 },
  commanderName:           { x: 210, y: 318, width: 118, height: 18, align: 'right', maxSize: 10 },
  commanderDate:           { x: 145, y: 318, width: 85,  height: 18, align: 'right', maxSize: 10 },
}

export const SIGNATURE_BOX: SignatureBox = { x: 25, y: 295, width: 100, height: 50 }
