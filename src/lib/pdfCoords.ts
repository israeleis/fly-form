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
