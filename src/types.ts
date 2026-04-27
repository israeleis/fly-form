export interface Commander {
  name: string;
  rank: string;
  personalNumber: string;
  signatureSvg: string;
}

export interface CommanderConfig {
  name: string;
  rank: string;
  personalNumber: string;
  commanderId: string;
  penColor: PenColor;
  fontStyle: FontStyle;
}

export interface Platoon {
  id: string;
  name: string;
  commander: Commander;
}

export type PenColor = 'black' | 'dark-blue' | 'blue'
export type FontStyle = 'rubik' | 'alef' | 'david-libre' | 'amatic-sc' | 'caveat' | 'fredoka-one'

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
  // Commander details (from URL or manual entry)
  commander: CommanderConfig | null;
  // PDF appearance
  penColor: PenColor;
  fontStyle: FontStyle;
}
