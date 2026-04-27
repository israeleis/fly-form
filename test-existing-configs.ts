import { decodeConfig } from './src/lib/configEncoder'
import { COMMANDER_CONFIGS } from './src/lib/commanderConfigs'

console.log('\n=== Testing Existing Predefined Commander Configs ===\n')

for (const [key, encoded] of Object.entries(COMMANDER_CONFIGS)) {
  console.log(`\nTesting: ${key}`)
  console.log(`Encoded string length: ${encoded.length} chars`)
  
  const decoded = decodeConfig(encoded)
  
  if (decoded) {
    console.log(`✓ Successfully decoded`)
    console.log(`  - name: ${decoded.name}`)
    console.log(`  - rank: ${decoded.rank}`)
    console.log(`  - personalNumber: ${decoded.personalNumber}`)
    console.log(`  - commanderId: ${decoded.commanderId}`)
    console.log(`  - penColor: ${decoded.penColor}`)
    console.log(`  - fontStyle: ${decoded.fontStyle}`)
  } else {
    console.log(`✗ FAILED to decode - validation failed`)
  }
}

console.log('\n=== Summary ===')
console.log('If any configs failed, they need to be re-encoded with the new format.')
