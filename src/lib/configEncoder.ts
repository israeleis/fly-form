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
    console.log('[decodeConfig] Starting with encoded length:', encoded.length)

    // Convert from URL-safe Base64URL back to Base64
    // Add padding back
    const padding = (4 - (encoded.length % 4)) % 4
    const base64 = encoded
      .replace(/-/g, '+')
      .replace(/_/g, '/') + '='.repeat(padding)

    const json = LZ.decompressFromBase64(base64)
    if (!json) {
      console.warn('[decodeConfig] Decompression returned null')
      return null
    }

    const parsed = JSON.parse(json) as unknown
    console.log('[decodeConfig] Parsed config:', parsed)

    // Validate all required fields exist
    const p = parsed as Record<string, unknown>
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'name' in parsed &&
      'rank' in parsed &&
      'personalNumber' in parsed &&
      'commanderId' in parsed &&
      'penColor' in parsed &&
      'fontStyle' in parsed &&
      typeof p.name === 'string' &&
      typeof p.rank === 'string' &&
      typeof p.personalNumber === 'string' &&
      typeof p.commanderId === 'string' &&
      typeof p.penColor === 'string' &&
      typeof p.fontStyle === 'string' &&
      ['black', 'dark-blue', 'blue'].includes(p.penColor) &&
      ['rubik', 'alef', 'david-libre', 'amatic-sc', 'caveat', 'fredoka-one'].includes(p.fontStyle)
    ) {
      console.log('[decodeConfig] ✓ Config validated:', p.name)
      return parsed as CommanderConfig
    }

    console.warn('[decodeConfig] Validation failed for config')
    return null
  } catch (err) {
    console.error('[decodeConfig] Exception:', err)
    return null
  }
}
