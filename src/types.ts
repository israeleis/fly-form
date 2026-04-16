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

export type PenColor = 'black' | 'dark-blue' | 'blue'
export type FontStyle = 'rubik' | 'alef' | 'david-libre' | 'amatic-sc' | 'solitreo'

export interface SoldierFormData {
  // Section 1
  personalNumber: string;
  lastName: string;
  firstName: string;
  rank: string;
  travelPurpose: string;
  contactLastName: string;
  contactFirstName: string;
  contactStreet: string;
  contactHouseNumber: string;
  contactCity: string;
  contactPhone: string;
  // Section 2
  destinationCountry: string;
  departureDate: string; // ISO date string YYYY-MM-DD
  returnDate: string;    // ISO date string YYYY-MM-DD
  flightRouteStops: string[];
  // Platoon selection
  platoonId: string;
  // PDF appearance
  penColor: PenColor;
  fontStyle: FontStyle;
}
