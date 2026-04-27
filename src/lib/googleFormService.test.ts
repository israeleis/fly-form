import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { submitCommanderSignature } from './googleFormService'

describe('submitCommanderSignature', () => {
  let appendedForms: HTMLFormElement[]
  let appendedIframes: HTMLIFrameElement[]

  beforeEach(() => {
    appendedForms = []
    appendedIframes = []
    vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
      if (node instanceof HTMLFormElement) appendedForms.push(node)
      if (node instanceof HTMLIFrameElement) appendedIframes.push(node)
      return node
    })
    vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node)
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('submits form to Google Forms URL with correct entry IDs', () => {
    submitCommanderSignature('israel', '<svg/>')

    expect(appendedForms).toHaveLength(1)
    const form = appendedForms[0]
    expect(form.action).toBe(
      'https://docs.google.com/forms/d/e/1FAIpQLSeC9zxydP45oPRSFhz0lgOU4rW4dSbAt2hrzE5Tw7P5Fy5ZVw/formResponse'
    )
    expect(form.method).toBe('post')

    const inputs = Array.from(form.querySelectorAll('input'))
    const byName = (n: string) => inputs.find((i) => i.name === n)?.value
    expect(byName('entry.2106411983')).toBe('israel')
    expect(byName('entry.1258428213')).toBe(btoa(unescape(encodeURIComponent('<svg/>'))))
  })

  it('creates a hidden iframe as the form target', () => {
    submitCommanderSignature('israel', '<svg/>')
    expect(appendedIframes).toHaveLength(1)
    const iframe = appendedIframes[0]
    expect(appendedForms[0].target).toBe(iframe.name)
  })

  it('cleans up form and iframe after 5 seconds', () => {
    const removeSpy = vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node)
    submitCommanderSignature('israel', '<svg/>')
    expect(removeSpy).not.toHaveBeenCalled()
    vi.advanceTimersByTime(5000)
    expect(removeSpy).toHaveBeenCalledTimes(2)
  })
})
