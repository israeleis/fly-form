import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fetchCommanderSignatures, clearSignaturesCache } from './googleSheetsService'

describe('fetchCommanderSignatures', () => {
  beforeEach(() => {
    clearSignaturesCache()
    vi.restoreAllMocks()
  })

  it('parses CSV into commanderId → signatureSvg map', async () => {
    const csv = 'Timestamp,id,sign\n2024-01-01,israel,PHN2Zy8+\n2024-01-02,8114-pl_a,PHN2Zy8+'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(csv),
    }))

    const result = await fetchCommanderSignatures()
    expect(result).toEqual({
      'israel': 'PHN2Zy8+',
      '8114-pl_a': 'PHN2Zy8+',
    })
  })

  it('last row wins for duplicate commanderIds', async () => {
    const csv = 'Timestamp,id,sign\n2024-01-01,israel,first\n2024-01-02,israel,last'
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(csv),
    }))

    const result = await fetchCommanderSignatures()
    expect(result?.['israel']).toBe('last')
  })

  it('returns null on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))

    const result = await fetchCommanderSignatures()
    expect(result).toBeNull()
  })

  it('returns cached result on second call', async () => {
    const csv = 'Timestamp,id,sign\n2024-01-01,israel,PHN2Zy8+'
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(csv),
    })
    vi.stubGlobal('fetch', mockFetch)

    await fetchCommanderSignatures()
    await fetchCommanderSignatures()

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })
})
