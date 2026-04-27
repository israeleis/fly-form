const FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSeC9zxydP45oPRSFhz0lgOU4rW4dSbAt2hrzE5Tw7P5Fy5ZVw/formResponse'

export async function submitCommanderSignature(
  commanderId: string,
  signatureSvg: string
): Promise<void> {
  const base64 = btoa(unescape(encodeURIComponent(signatureSvg)))

  const body = new URLSearchParams()
  body.set('entry.2106411983', commanderId)
  body.set('entry.1258428213', base64)

  try {
    await fetch(FORM_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
  } catch {
    throw new Error('שגיאת רשת — לא הצליח לשלוח חתימה')
  }
}
