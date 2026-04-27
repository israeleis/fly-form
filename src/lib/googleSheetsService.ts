const SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/1yk-WBF8nTd3v2QTCx6ovysPlRXLg2_EW3mD6h4Ti2WA/export?format=csv'

let cache: Record<string, string> | null = null

export function clearSignaturesCache(): void {
  cache = null
}

export async function fetchCommanderSignatures(): Promise<Record<string, string> | null> {
  if (cache !== null) return cache

  try {
    const res = await fetch(SHEET_CSV_URL)
    if (!res.ok) return null

    const text = await res.text()
    const lines = text.trim().split(/\r?\n/)
    if (lines.length < 2) return {}

    // First line is header: find id and sign column indices
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''))
    const idIdx = headers.indexOf('id')
    const signIdx = headers.indexOf('sign')
    if (idIdx === -1 || signIdx === -1) return null

    const result: Record<string, string> = {}
    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i])
      const id = cols[idIdx]?.trim()
      const sign = cols[signIdx]?.trim()
      if (id && sign) result[id] = sign  // last row wins for duplicates
    }

    cache = result
    return result
  } catch {
    return null
  }
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0
  while (i < line.length) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 2
        continue
      }
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
    i++
  }
  result.push(current)
  return result
}
