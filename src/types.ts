export interface Commander {
  name: string;
  rank: string;
  personalNumber: string;
  signatureSvg: string;
}

export interface Platoon {
  id: string;
  name: string;
  commander: Commander;
}

export interface SoldierFormData {
  // Section 1
  personalNumber: string;
  lastName: string;
  firstName: string;
  rank: string;
  travelPurpose: string;
  contactLastName: string;
  contactFirstName: string;
  contactAddress: string;
  contactPhone: string;
  // Section 2
  destinationCountry: string;
  departureDate: string; // ISO date string YYYY-MM-DD
  returnDate: string;    // ISO date string YYYY-MM-DD
  flightRoute: string;
  // Platoon selection
  platoonId: string;
}
