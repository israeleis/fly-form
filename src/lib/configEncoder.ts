import LZ from 'lz-string'
import type { CommanderConfig } from '../types'

export function encodeConfig(config: CommanderConfig): string {
  const json = JSON.stringify(config)
  const compressed = LZ.compressToBase64(json)
  // Convert to URL-safe Base64URL by replacing chars and removing padding
  const urlSafe = compressed
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  return urlSafe
}

export function decodeConfig(encoded: string): CommanderConfig | null {
  try {
    // Convert from URL-safe Base64URL back to Base64
    // Add padding back
    const padding = (4 - (encoded.length % 4)) % 4
    const base64 = encoded
      .replace(/-/g, '+')
      .replace(/_/g, '/') + '='.repeat(padding)

    const json = LZ.decompressFromBase64(base64)
    if (!json) return null

    const parsed = JSON.parse(json) as unknown

    // Validate all required fields exist
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'name' in parsed &&
      'rank' in parsed &&
      'personalNumber' in parsed &&
      'signatureSvg' in parsed &&
      typeof (parsed as Record<string, unknown>).name === 'string' &&
      typeof (parsed as Record<string, unknown>).rank === 'string' &&
      typeof (parsed as Record<string, unknown>).personalNumber === 'string' &&
      typeof (parsed as Record<string, unknown>).signatureSvg === 'string'
    ) {
      return parsed as CommanderConfig
    }

    return null
  } catch {
    return null
  }
}
