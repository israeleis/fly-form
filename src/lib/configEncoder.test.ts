import { describe, it, expect } from 'vitest'
import { encodeConfig, decodeConfig } from './configEncoder'
import type { CommanderConfig } from '../types'

describe('configEncoder', () => {
  const testConfig: CommanderConfig = {
    name: 'ישראל ישראלי',
    rank: 'סגן',
    personalNumber: '1234567',
    commanderId: 'cmd-123',
  }

  it('should encode and decode config without data loss', () => {
    const encoded = encodeConfig(testConfig)
    const decoded = decodeConfig(encoded)
    expect(decoded).toEqual(testConfig)
  })

  it('should produce a URL-safe string', () => {
    const encoded = encodeConfig(testConfig)
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('should return null for invalid encoded string', () => {
    const result = decodeConfig('invalid!!!data')
    expect(result).toBeNull()
  })

  it('should return null if decoded JSON is missing required fields', () => {
    const incomplete = { name: 'test' }
    const json = JSON.stringify(incomplete)
    const encoded = Buffer.from(json).toString('base64')
    const result = decodeConfig(encoded)
    expect(result).toBeNull()
  })
})
