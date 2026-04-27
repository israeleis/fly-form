const FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSeC9zxydP45oPRSFhz0lgOU4rW4dSbAt2hrzE5Tw7P5Fy5ZVw/formResponse'

export async function submitCommanderSignature(
  commanderId: string,
  signatureSvg: string
): Promise<void> {
  const base64 = btoa(unescape(encodeURIComponent(signatureSvg)))

  const body = new URLSearchParams()
  body.set('entry.481316437', commanderId)
  body.set('entry.364629533', base64)
  body.set('fvv', '1')
  body.set('pageHistory', '0')
  // fbzx is a session token Google Forms expects; any large integer works for anonymous forms
  body.set('fbzx', String(Math.floor(Math.random() * 9e18)))

  try {
    await fetch(FORM_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: body.toString(),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  } catch (err) {
    console.error('[googleFormService] submit failed:', err)
    throw new Error('שגיאת רשת — לא הצליח לשלוח חתימה')
  }
}
