const LTR_RUN_PATTERN = /[A-Za-z0-9][A-Za-z0-9\-+/.,'"():]*/g

function reverseText(text: string): string {
  return [...text].reverse().join('')
}

export function reverseLtrRunForPdf(text: string): string {
  if (!text) return ''
  return reverseText(text)
}

export function formatPdfTextForBidi(text: string): string {
  if (!text) return ''
  return text.replace(LTR_RUN_PATTERN, (match) => reverseLtrRunForPdf(match))
}

export function formatContactAddressForPdf(
  street: string,
  houseNumber: string,
  city: string,
): string {
  return formatPdfTextForBidi(
    [street, houseNumber, city]
      .filter(Boolean)
      .join(' ')
  )
}
