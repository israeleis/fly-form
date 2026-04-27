// Pre-encoded commander configurations
// Format: key -> encoded config string for quick sharing
// These configs use the new architecture: commanderId instead of signatureSvg
// This reduces config size by ~83% (168-178 chars vs 1021+ chars with SVG)

export const COMMANDER_CONFIGS: Record<string, string> = {
  'israel': 'N4IgdghgtgpiBcJCLoIfdAAEgN0EJugWkgDQgBOEYA1giIBeggh6CAvoCgSAA4xEDOA9pADYByAVygAjNpQCsADnEA2AJziALEwDGnKFFIATNgEktlAJbsSMHk1ZgAwpx6cilYTwgqKhAGbcALgGUvATx44RCIBYUMKAF8gA',
  '8114-mesayat': 'N4IgdghgtgpiBcJCLoIfdAAEgN0EJugWkgDQgBOEYA1giIBeggh6CAvoCgSAA4xEDOA9pADYByAVygAjNpQCsADnEA2AJziALEwDGnKFFIATNgEktlSQEYjigLSx2EAJ4QALk1ZgAwpx6cilYTwgqKhADNuOwBlO2seOEQiAWEASwoAXyA',
  '8114-pl_a': 'N4IgdghgtgpiBcJCLoIfdAAEgN0EJugWkgDQgBOEYA1giIBeggh6CAvoCgSAA4xEDOA9pADYByAVygAjNpQCsADnEA2AJziALEwDGnKFFIATNgEktlSQEYjigLTMeAfQhNWYAMKcenIpWE8IKioQBm3ABcAZQCATx44RCIBYQBLCgBfIA',
}

export function getCommanderConfig(key: string): string | undefined {
  return COMMANDER_CONFIGS[key.toLowerCase()]
}
