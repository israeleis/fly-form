// All coordinates are in pdf-lib points (origin: bottom-left of page).
// These are approximate and may need adjustment after visual calibration.
// Run the app in dev, generate a test PDF, and compare against the template.

export const FONT_SIZE = 10

export const COORDS = {
  // Section 1 — Row 1 (top data row)
  // White data cells span y≈660–680; place text at y=668 (middle of cell)
  personalNumber:   { x: 430, y: 668 },
  lastName:         { x: 310, y: 668 },
  firstName:        { x: 210, y: 668 },
  rank:             { x: 130, y: 668 },
  travelPurpose:    { x: 50,  y: 668 },

  // Section 1 — Row 2 (contact person)
  // White data cells span y≈608–625; place text at y=615
  contactLastName:  { x: 310, y: 615 },
  contactFirstName: { x: 210, y: 615 },
  contactAddress:   { x: 130, y: 615 },
  contactPhone:     { x: 50,  y: 615 },

  // Section 2 — Trip details row
  // White data cells span y≈510–530; place text at y=518
  destinationCountry: { x: 430, y: 518 },
  departureDate:      { x: 310, y: 518 },
  returnDate:         { x: 200, y: 518 },
  stayDays:           { x: 90,  y: 518 },

  // Section 2b — Flight route (multiline, max 2 lines)
  // Text area spans y≈420–460; place text at y=448
  flightRoute: { x: 490, y: 448 },

  // Section 3 — Commander details
  // Underline row spans y≈340–358; place text at y=348
  commanderPersonalNumber: { x: 430, y: 348 },
  commanderRank:           { x: 310, y: 348 },
  commanderName:           { x: 200, y: 348 },
  commanderDate:           { x: 100, y: 348 },
  commanderSignature:      { x: 40,  y: 310, width: 120, height: 50 },
}
