import fs from 'fs';
import LZ from 'lz-string';

// Read the SVG file
const svgPath = '/Users/ieisenman/Downloads/Gemini_Generated_Image_8snsz08snsz08sns.svg';
const signatureSvg = fs.readFileSync(svgPath, 'utf-8');

// The existing encoded config from the URL
const existingEncoded = 'N4IgdghgtgpiBcJCLoIfdAAEgN0EJugWkgDQgBOEYA1giIBeggh6CAvoCgSAA4xEDOA9pADYByAVygAjNpQCsADnEA2AJziALE3YBLAOaQALgKIwAygDd1lADztjaAB5QeYdgF4AOiAAWWrc3gB6bwHcAgDo_AGZAziJ1bwAmAAZ47wt1FzQ_VQATLVdnEEV4lNcYDXccgEY4lwA-JzBTZggstHScgFkQxTl8EPFAyQB2cTQU9i0iTjIYHOEeCABjMmHR8ZgAWjTM7JdolIAzVR4eHLBuGEWxiZWeVTAYWYhmHLGBMHSz5cvrmAArTmvHzmerxA3mqtXqjWaLja4lKXUkvQGaAAMt1YSF4f1BiiYV05AisajcfjkYSQnjMSScWTidi0eSBm8JlMZvNGat1lkctsQGg9gcjic2R8bncHi4ni8hVcbj8_uKAZLgaDTIljJUmKwwABhTg8CKUaYCOCEHbcLT6LQATx4cEQRAEwlUFAAvkA';

// Decode the existing config
const base64 = existingEncoded
  .replace(/-/g, '+')
  .replace(/_/g, '/')
  .padEnd(existingEncoded.length + (4 - (existingEncoded.length % 4)) % 4, '=');

const json = LZ.decompressFromBase64(base64);
const config = JSON.parse(json);

console.log('Current config:');
console.log(JSON.stringify(config, null, 2));

// Replace signature with new one
config.signatureSvg = signatureSvg;

// Re-encode
const newJson = JSON.stringify(config);
const compressed = LZ.compressToBase64(newJson);
const urlSafe = compressed
  .replace(/\+/g, '-')
  .replace(/\//g, '_')
  .replace(/=/g, '');

const baseUrl = 'https://israeleis.github.io/fly-form/';
const newLink = `${baseUrl}#/?c=${urlSafe}`;

console.log('\n✓ New link created:');
console.log(newLink);
console.log('\nLink length:', newLink.length, 'characters');
