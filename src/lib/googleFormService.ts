const FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSeC9zxydP45oPRSFhz0lgOU4rW4dSbAt2hrzE5Tw7P5Fy5ZVw/formResponse'

export function submitCommanderSignature(
  commanderId: string,
  signatureSvg: string
): void {
  const base64 = btoa(unescape(encodeURIComponent(signatureSvg)))

  const iframeName = `gform-${Date.now()}`
  const iframe = document.createElement('iframe')
  iframe.name = iframeName
  iframe.style.cssText = 'display:none;position:absolute;width:0;height:0'
  document.body.appendChild(iframe)

  const form = document.createElement('form')
  form.method = 'POST'
  form.action = FORM_URL
  form.target = iframeName
  form.style.display = 'none'

  const addField = (name: string, value: string) => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  }

  addField('entry.2106411983', commanderId)
  addField('entry.1258428213', base64)

  document.body.appendChild(form)
  form.submit()

  // Clean up after the iframe has had time to submit
  setTimeout(() => {
    document.body.removeChild(form)
    document.body.removeChild(iframe)
  }, 5000)
}
