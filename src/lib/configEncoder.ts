import type { CommanderConfig } from '../types'

// Format: "name|rank|personalNumber|commanderId" → base64url
// Handles Hebrew via encodeURIComponent before btoa

export function encodeConfig(config: CommanderConfig): string {
  const csv = [config.name, config.rank, config.personalNumber, config.commanderId].join('|')
  const base64 = btoa(unescape(encodeURIComponent(csv)))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function decodeConfig(encoded: string): CommanderConfig | null {
  try {
    const padding = (4 - (encoded.length % 4)) % 4
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padding)
    const csv = decodeURIComponent(escape(atob(base64)))
    const [name, rank, personalNumber, commanderId] = csv.split('|')
    if (!name || !rank || !personalNumber || !commanderId) return null
    return { name, rank, personalNumber, commanderId }
  } catch {
    return null
  }
}
