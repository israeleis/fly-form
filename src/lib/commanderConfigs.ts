// Pre-encoded commander configurations
// Format: key -> encoded config string for quick sharing
// These configs use the new architecture: commanderId instead of signatureSvg
// This reduces config size by ~83% (168-178 chars vs 1021+ chars with SVG)

export const COMMANDER_CONFIGS: Record<string, string> = {
  'israel': 'N4IgdghgtgpiBcJCboIS9BAXoIBdBA7oAAg0wNdBAD0ED3QQfdAQAaEAJwjAGsERBD0ECXQC6gBxhoGcA9pAA2AOQCuUAEa9mAdgCcAFgCsANgBMARiogAxgKhR6AE14BJE_OXrtIAL5A',
  '8114-mesayat': 'N4IgdghgtgpiBcJB7oAOgASBPQQO6CFXQQS6CAroCADQgBOEYA1giIIeggF6CD7oCSAA4xkDOA9pADYA5AK5QARp1oBGAEwBmACwBWAGwB2VgGMeUKJQAmnAJL7p85epABfIA',
  '8114-pl_a': 'N4IgdghgtgpiBcJB7oAOgARMOuggd0EOeggV0DUAXQEAGhACcIwBrBEQQ9BAl0AB1kyQAHGCgZwHtIAGwByAVygAjHvQBMAZgAsAVgBsAdgAcHAMb8oUagBMeASSNylarSAC-QA',
}

export function getCommanderConfig(key: string): string | undefined {
  return COMMANDER_CONFIGS[key.toLowerCase()]
}
