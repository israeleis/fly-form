import LZ from 'lz-string';

// Extract the encoded part from the URL
const encoded = 'N4IgdghgtgpiBcJCboIFdBCroIZdAUAJA7oIRdBAD0DUKRABoQAnCMAawREAvQQQ9BAX0EH3QCkABxioDOAe0gAbAHIBXKACN-jAKwAWAEwAGAJwqAjNwEBLAOaQALpKowAygDdDjADwDb2AB5RRYAQF4AOiAAWJiY88AD0oQDuUQB0EQDM0UJUhqHqamqhToZ-2BH6ACYm_r4gSuk5_jBGgSXa6n4AfD5g9jwQRdj5JQCyKgAcGtFxAOwKagpxStp9fWqT5MMJymoqKkpxCgPDSkoAbNgAMirbQ5MrwxeXw33kfSrRfQracRtKw-mPChqHx_fTE5o7hpxho-rtbgohpttIs1MNdloXiofu8hho3tptBM-nttOC-sNotolAThs9dqMdCSfrs-tENLtVnEVMCvkClLc6UznnMpjNxjTCTC8ZNdli4jjhpz6XENHEEbtodoGXEaZCViy8bttTrFrdBiztgM4niVLKJjT7gSpqCycN0TN9dFDSS5abzaqjmLomo-vL0qpFmM9k6Xcb3RoLV61NFhiplLN4YjfRyBj7tXGPsp3vGaTG4wm4QizSnbrt6dN0jp5ZTkV6_gp7V8yjDNOtbkpospGXCVLslJHRjTy31nk8B42-wpbgltOlxpNprMNgoUTHZRjxTixfjO77diM7uM6n7tCiEvGGbTl3y_RCiW81GKGdCdCjO8XidsNltpwTY8SmwvMBLxKO-0Sfm86ybBooxOhs_YHhSCjVui57Ol82r8ouMxxE6ZJKEBIGgTSgzMnMKEKP2c59uQGjaF2x6joysomgoq5epCiz0exoIsk-dExnK8K7CsVFTGJeaxvGJJFsmOKCT6dRqMqJZJv0PwTF2B6-vCT5-vCeFpnGdybNmHz9j86xEhcYqUuSozTsCPpgoe6hPP0Jo_McsbXG8qwBQFRmDPubnHp5Z5HJiQxqAOFIOnasGKXicIjDCCWYocyqQqydx9hOcbaopkbPK87y-uxWWPA8flxoFQV0QxhGjrC6nMp66WxsC6w3kusV0fctJ1GM86jd8BwwuWVGLGKmJzZieFaPSsXMsWcRyRxMKdny_Ymixbo3PRpy0uM7FnVR-wTWSFaVud53gs56k4n1i4dQi0RlHF9okokUpHeok39O5J5gRNFIQcS8ovqOyoUopB6qFMhEsjxm3al2ZQqfpIyiX967Boma1PsMWVxvSYJ4sjGj0YRRl0gjayASjzx1tMnazFMLNvK5tFgj6AI7AS6VjJFyp0uMhFlGy_EHmWRL8gSom0jjPzPA8mKzHdZ1Snz7U8jhHORasBpzpGFWPr6Nz_hM8bkR5R6emss62TCKEOex0rMSyxwbLFfZ9JpkIbPKjxbNBWhOl7WhBn7tLDh97HmsztOR6a0e-6ocdHBcRKgqCwY-08qeMunBdZ_0hKrAeZVZn-gxR4XscB0cDI2XKfbJhcxfezHmfN-tCSLpm5vvNo3el03hzrXSZIbMSg5TuPjd91Pc4PIyZr8dLGhL73_ur_cLKbtiuKNtKYkIjsV87FGJqDwicLhUeyi3ISXzMliMPQ3WJrsypyg0xQtTFQr8PpX1gjzN41NV5TS0F-aCYd8TlmEtqC-ElcwHBNOLNYjIlYGTFHLa4AxVDrXUqoVeIU86PD9kGMe_5qZ-h2Cpd46JYpT3UF2X-SF7IjFAVRTYioJSnyouwhiawLgrGpoBOmH0eJPnQfwz0H8ILjDyv2Be_ZpRTAIt-GCQ5ME6HpAedEaliypkrrSVQGV7QUlEUYjcpitCpnLLFCYlFqJiXGsolUJjSFmI7LGKBWodTai0HYnxJC5JrDllqYejxHx4nYTGGYkY_TEXmNVVY2w5jbnFJGChPoqEF1oXLAMq1O60kumxGqXxfSYmhniGc9JgSKlbKw00q8YyAWpj-WC6x8QMUxADCp9EvGxQ-ile0IIgR0PuKQ7Yk51GbCnukD68J4RA3CjvaqIcrE_WFs3FkI5IwXTNG6Rk0pFQ6GBG0soZofjoh9OtUSYcNjdSdFc5UzC2wrEdmmFSCIXh6WVodfMU4BxM2pnMH4o4HjKGWNvASjzsmrAQX0jiPt6SjGBF_RUo5FqQgSRKGYJKZgky9G_Q0yhl4EudPOCYt5eSXT7BePW-D9IckeVoam8V9mzGZd6X0_oaEZwelaYsz1sKBhpAxIVokRXBjFUMeEdR0r7OuDKlywrAyisUoRWKhN5JG0FX6eVOrFWR33AGZehzGREkbJGdpLD2xplmGCa1vdbXqmNsEkJeoZixkmIzKm9FaQ5AECYKgQg6AwBKDIUQEAADGdBw2RujTAAAtHkQoxQ_AqByAAM30KIUQJQwAiBgKmqNMaM2iH0GAGAiaIA8BKFGyQYB8hVvTbW-tMAABWQh62tqEO2ztIBQhNBaJkWwDRuB8DAAAYSEKIJIjB41JoYJQAtIgTCWBMAAT1EHARABaLD5GjRADNFaQAAF8gA';

console.log('Encoded string length:', encoded.length);
console.log('');

try {
  // Try to decompress as-is (assuming it's already URL-safe base64)
  const decompressed = LZ.decompressFromBase64(encoded);
  
  if (!decompressed) {
    console.log('❌ Direct decompression returned empty result');
    console.log('Converting from URL-safe to standard base64...');
    
    const standardBase64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const decompressed2 = LZ.decompressFromBase64(standardBase64);
    
    if (decompressed2) {
      console.log('✓ Successfully decompressed after conversion!\n');
      const config = JSON.parse(decompressed2);
      console.log('Commander Config:');
      console.log(JSON.stringify(config, null, 2));
    } else {
      console.log('❌ Decompression still failed');
    }
  } else {
    console.log('✓ Successfully decompressed!\n');
    const config = JSON.parse(decompressed);
    console.log('Commander Config:');
    console.log(JSON.stringify(config, null, 2));
  }
} catch (err) {
  console.error('Error:', err.message);
  
  // Try converting from URL-safe to standard base64
  console.log('\n✓ Attempting conversion from URL-safe to standard base64...');
  const standardBase64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  
  try {
    const decompressed = LZ.decompressFromBase64(standardBase64);
    if (decompressed) {
      console.log('Successfully decompressed!\n');
      const config = JSON.parse(decompressed);
      console.log('Commander Config:');
      console.log(JSON.stringify(config, null, 2));
    } else {
      console.error('Decompression still failed');
    }
  } catch (err2) {
    console.error('Conversion also failed:', err2.message);
  }
}
