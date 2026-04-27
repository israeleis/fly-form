/**
 * Commander Signatures Repository
 *
 * This file stores SVG signature strings for each commander.
 * Signatures are provided as base64-encoded data via WhatsApp and stored here as SVG strings.
 *
 * Format:
 * - Key: Commander ID (e.g., 'israel', '8114-mesayat', '8114-pl_a')
 * - Value: SVG string (must be valid SVG markup)
 *
 * How to add new signatures:
 * 1. Commander sends signature as base64 from WhatsApp/CommanderSetup page
 * 2. Decode the base64 to get the full config
 * 3. Extract the signatureSvg field
 * 4. Add/update the entry below with: commanderId -> SVG string
 * 5. Commit and deploy
 */

export const COMMANDER_SIGNATURES: Record<string, string> = {
  // TODO: Add more real signatures from commanders
  // As commanders send their signatures via WhatsApp, add them here.
  // Each signature should be the raw SVG string from the config.

  // Placeholder - will be replaced with real signature when available
  'israel': '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M10,60 Q50,10 100,50 Q150,90 190,30" stroke="black" stroke-width="2" fill="none"/></svg>',

  // TODO: '8114-mesayat' - waiting for signature from commander
  // TODO: '8114-pl_a' - waiting for signature from commander
}

export function getSignatureSvg(commanderId: string): string | undefined {
  return COMMANDER_SIGNATURES[commanderId]
}
