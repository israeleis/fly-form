// All coordinates are in pdf-lib points (origin: bottom-left of page).
// These are approximate and may need adjustment after visual calibration.
// Run the app in dev, generate a test PDF, and compare against the template.

export const FONT_SIZE = 10

export const COORDS = {
  // Section 1 — Row 1 (top data row)
  personalNumber:   { x: 430, y: 650 },
  lastName:         { x: 310, y: 650 },
  firstName:        { x: 210, y: 650 },
  rank:             { x: 130, y: 650 },
  travelPurpose:    { x: 50,  y: 650 },

  // Section 1 — Row 2 (contact person)
  contactLastName:  { x: 310, y: 605 },
  contactFirstName: { x: 210, y: 605 },
  contactAddress:   { x: 130, y: 605 },
  contactPhone:     { x: 50,  y: 605 },

  // Section 2 — Trip details row
  destinationCountry: { x: 430, y: 540 },
  departureDate:      { x: 310, y: 540 },
  returnDate:         { x: 200, y: 540 },
  stayDays:           { x: 90,  y: 540 },

  // Section 2b — Flight route (multiline, max 2 lines)
  flightRoute: { x: 490, y: 490 },

  // Section 3 — Commander details
  commanderPersonalNumber: { x: 430, y: 340 },
  commanderRank:           { x: 310, y: 340 },
  commanderName:           { x: 200, y: 340 },
  commanderDate:           { x: 100, y: 340 },
  commanderSignature:      { x: 40,  y: 310, width: 120, height: 50 },
}
