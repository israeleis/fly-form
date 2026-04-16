import { describe, it, expect } from 'vitest'
import { svgToPng } from './svgToPng'

describe('svgToPng', () => {
  it('rejects when given empty SVG string', async () => {
    await expect(svgToPng('')).rejects.toThrow('Empty SVG')
  })

  // Skipped: svgToPng uses URL.createObjectURL, Image, and canvas.toBlob which
  // are browser-only APIs not fully supported by jsdom. This test requires a
  // real browser environment (e.g., Playwright or a headed Vitest browser mode).
  it.skip('returns a Uint8Array for valid SVG', async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="50">
      <rect width="100" height="50" fill="red"/>
    </svg>`
    const result = await svgToPng(svg)
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(0)
  })
})
