import { encodeConfig, decodeConfig } from './src/lib/configEncoder'
import type { CommanderConfig } from './src/types'

// Test 1: Valid config with commanderId
const validConfig: CommanderConfig = {
  name: 'ישראל ישראלי',
  rank: 'סגן',
  personalNumber: '1234567',
  commanderId: 'cmd-123',
  penColor: 'black',
  fontStyle: 'rubik',
}

const encoded = encodeConfig(validConfig)
console.log('✓ Valid config encoded:', encoded.length, 'chars')
const decoded = decodeConfig(encoded)
console.log('✓ Valid config decoded:', decoded?.commanderId)

// Test 2: Empty commanderId
const emptyIdConfig: CommanderConfig = {
  name: 'ישראל ישראלי',
  rank: 'סגן',
  personalNumber: '1234567',
  commanderId: '', // Empty!
  penColor: 'black',
  fontStyle: 'rubik',
}

const encoded2 = encodeConfig(emptyIdConfig)
console.log('✓ Empty ID config encoded:', encoded2.length, 'chars')
const decoded2 = decodeConfig(encoded2)
console.log('✓ Empty ID config decoded:', decoded2?.commanderId === '')
