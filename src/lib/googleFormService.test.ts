import { describe, it, expect, vi, beforeEach } from 'vitest'
import { submitCommanderSignature } from './googleFormService'

describe('submitCommanderSignature', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('posts to Google Form with correct entry IDs', async () => {
    const mockFetch = vi.fn().mockResolvedValue({})
    vi.stubGlobal('fetch', mockFetch)

    await submitCommanderSignature('israel', '<svg/>')

    expect(mockFetch).toHaveBeenCalledWith(
      'https://docs.google.com/forms/d/e/1FAIpQLSeC9zxydP45oPRSFhz0lgOU4rW4dSbAt2hrzE5Tw7P5Fy5ZVw/formResponse',
      expect.objectContaining({
        method: 'POST',
        mode: 'no-cors',
      })
    )

    const body = mockFetch.mock.calls[0][1].body as URLSearchParams
    expect(body.get('entry.2106411983')).toBe('israel')
    expect(body.get('entry.1258428213')).toBe(btoa(unescape(encodeURIComponent('<svg/>'))))
  })

  it('throws a Hebrew error message on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network error')))

    await expect(submitCommanderSignature('israel', '<svg/>')).rejects.toThrow(
      'שגיאת רשת — לא הצליח לשלוח חתימה'
    )
  })
})
