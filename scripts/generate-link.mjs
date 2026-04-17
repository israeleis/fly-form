#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import LZ from 'lz-string'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Get arguments from command line
const args = process.argv.slice(2)
if (args.length < 2) {
  console.error('Usage: node generate-link.mjs <base-url> <signature-svg-path>')
  console.error('Example: node generate-link.mjs "https://israeleis.github.io/fly-form/#/?c=N4IgdghgtgpiBcJCLoI..." "/Users/ieisenman/Downloads/Gemini_Generated_Image_8snsz08snsz08sns.svg"')
  process.exit(1)
}

const baseUrl = args[0]
const signaturePath = args[1]

// Extract the 'c' parameter from the URL
const urlMatch = baseUrl.match(/[?&#]c=([^&]*)/)
if (!urlMatch) {
  console.error('Error: Could not find c parameter in URL')
  process.exit(1)
}

const urlSafeEncoded = urlMatch[1]

// Convert from URL-safe base64 back to standard base64
// Replace - with +, _ with /, and add padding
let standardBase64 = urlSafeEncoded.replace(/-/g, '+').replace(/_/g, '/')
// Add padding
const padLength = (4 - (standardBase64.length % 4)) % 4
if (padLength) {
  standardBase64 += '='.repeat(padLength)
}

// Decode the existing config
let config
try {
  const decompressed = LZ.decompressFromBase64(standardBase64)
  config = JSON.parse(decompressed)
  console.log('✓ Decoded existing config')
} catch (e) {
  console.error('Error decoding config:', e.message)
  process.exit(1)
}

// Read the signature SVG
let signatureSvg
try {
  signatureSvg = fs.readFileSync(signaturePath, 'utf-8')
  console.log(`✓ Read signature SVG (${signatureSvg.length} bytes)`)
} catch (e) {
  console.error('Error reading signature SVG:', e.message)
  process.exit(1)
}

// Replace the signature in config
config.signatureSvg = signatureSvg

// Re-encode the config
const reencoded = JSON.stringify(config)
const compressed = LZ.compressToBase64(reencoded)

// Convert to URL-safe base64 (replace +/= with -_)
const urlSafe = compressed.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

// Generate the final link
const finalUrl = `https://israeleis.github.io/fly-form/#/?c=${urlSafe}`

console.log('\n✓ Generated new link:')
console.log(finalUrl)
console.log(`\nLink size: ${finalUrl.length} characters`)
console.log(`Compressed config size: ${compressed.length} bytes (uncompressed: ${reencoded.length} bytes)`)
