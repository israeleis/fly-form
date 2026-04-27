export const COMMANDER_SIGNATURES: Record<string, string> = {
  'israel': '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M10,60 Q50,10 100,50 Q150,90 190,30" stroke="black" stroke-width="2" fill="none"/></svg>',
}

export function getSignatureSvg(commanderId: string): string | undefined {
  return COMMANDER_SIGNATURES[commanderId]
}
