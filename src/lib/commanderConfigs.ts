// Pre-encoded commander configurations
// Format: key -> encoded config string for quick sharing
// These configs use the new architecture: commanderId instead of signatureSvg
// This reduces config size by ~83% (168-178 chars vs 1021+ chars with SVG)

export const COMMANDER_CONFIGS: Record<string, string> = {
  'israel':        '15nXqdeo15DXnCDXkNeZ15bXoNee159816HXkteffDc5NDU2MjF8Nzk0NTYyMQ',
  '8114-mesayat':  '154uINek15zXldeS15R816HXqNeffDEyMzQ1Njd8MTIzNDU2Nw',
  '8114-pl_a':     '154uINee15fXnNen15Qg15B816HXkiLXnnwyMzQ1Njc4fDIzNDU2Nzg',
}

export function getCommanderConfig(key: string): string | undefined {
  return COMMANDER_CONFIGS[key.toLowerCase()]
}
