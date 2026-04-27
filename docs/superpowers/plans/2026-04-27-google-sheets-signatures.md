# Google Sheets Signature Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static commanderSignatures.ts config with live Google Sheets data — commanders submit signatures via the CommanderSetup form; SoldierForm fetches signatures dynamically.

**Architecture:** Two new service modules (googleSheetsService.ts, googleFormService.ts) handle all external I/O. CommanderSetup checks existing signatures and gates link generation. SoldierForm fetches at mount and falls back to static config on failure.

**Tech Stack:** React, TypeScript, native fetch API, Google Forms formResponse endpoint, Google Sheets CSV export

---

## File Structure

- **Create:** `src/lib/googleSheetsService.ts` — fetch + parse + cache CSV from public Google Sheet
- **Create:** `src/lib/googleFormService.ts` — POST signature to Google Form via no-cors fetch
- **Modify:** `src/pages/CommanderSetup.tsx` — check existing sig, submit button, gate link generation
- **Modify:** `src/pages/SoldierForm.tsx` — fetch signatures at mount, fall back to static config

---

## Tasks

### Task 1: Create googleSheetsService.ts

**Files:**
- Create: `src/lib/googleSheetsService.ts`
- Create: `src/lib/googleSheetsService.test.ts`

The Google Sheet CSV export URL is:
`https://docs.google.com/spreadsheets/d/1yk-WBF8nTd3v2QTCx6ovysPlRXLg2_EW3mD6h4Ti2WA/export?format=csv`

The CSV has columns: `id` (commanderId), `sign` (signatureSvg as base64).

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/googleSheetsService.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- googleSheetsService
```
Expected: FAIL — `fetchCommanderSignatures` is not defined

- [ ] **Step 3: Implement googleSheetsService.ts**

```typescript
// src/lib/googleSheetsService.ts
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
    const lines = text.trim().split('\n')
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
  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- googleSheetsService
```
Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/googleSheetsService.ts src/lib/googleSheetsService.test.ts
git commit -m "feat: add googleSheetsService to fetch commander signatures from sheet"
```

---

### Task 2: Create googleFormService.ts

**Files:**
- Create: `src/lib/googleFormService.ts`
- Create: `src/lib/googleFormService.test.ts`

Google Form submission URL: `https://docs.google.com/forms/d/e/1FAIpQLSeC9zxydP45oPRSFhz0lgOU4rW4dSbAt2hrzE5Tw7P5Fy5ZVw/formResponse`
Field entry IDs:
- `entry.2106411983` → commanderId
- `entry.1258428213` → signatureSvg (as base64)

The signature is stored as base64 in the form (not raw SVG) to keep it compact.

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/googleFormService.test.ts
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- googleFormService
```
Expected: FAIL — `submitCommanderSignature` is not defined

- [ ] **Step 3: Implement googleFormService.ts**

```typescript
// src/lib/googleFormService.ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- googleFormService
```
Expected: 2 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/googleFormService.ts src/lib/googleFormService.test.ts
git commit -m "feat: add googleFormService to submit commander signatures to Google Form"
```

---

### Task 3: Update CommanderSetup.tsx

**Files:**
- Modify: `src/pages/CommanderSetup.tsx`

Add three behaviors:
1. When commanderId changes (on blur), check if signature already exists in Sheets
2. "עדכן חתימה" button submits signature to Google Form
3. "צור קישור משותף" is gated: only enabled if signature exists in Sheets OR was just submitted

- [ ] **Step 1: Add new state and imports at top of CommanderSetup.tsx**

Replace the existing imports block and add new state variables:

```typescript
import { useState, useEffect, type CSSProperties } from 'react'
import { SignaturePad } from '../components/SignaturePad'
import { encodeConfig } from '../lib/configEncoder'
import { FONT_STYLE_OPTIONS, getFontStyleOption } from '../lib/fontStyles'
import { submitCommanderSignature } from '../lib/googleFormService'
import { fetchCommanderSignatures, clearSignaturesCache } from '../lib/googleSheetsService'
import type { PenColor, FontStyle } from '../types'
```

Add these state variables inside `CommanderSetup()` after the existing state:

```typescript
const [signatureSubmitted, setSignatureSubmitted] = useState(false)
const [submitting, setSubmitting] = useState(false)
const [existingSignature, setExistingSignature] = useState(false)
const [checkingExisting, setCheckingExisting] = useState(false)
```

- [ ] **Step 2: Add handleCommanderIdBlur to check existing signature**

Add this function after `handleCopySignatureBase64`:

```typescript
async function handleCommanderIdBlur() {
  const id = form.commanderId.trim()
  if (!id) return
  setCheckingExisting(true)
  const signatures = await fetchCommanderSignatures()
  setExistingSignature(signatures !== null && id in signatures)
  setCheckingExisting(false)
}
```

- [ ] **Step 3: Add handleSubmitSignature function**

Add this function after `handleCommanderIdBlur`:

```typescript
async function handleSubmitSignature() {
  setError('')
  if (!form.commanderId.trim()) {
    setError('יש למלא את ID המפקד לפני הגשת חתימה')
    return
  }
  if (!form.signatureSvg) {
    setError('יש לצייר ולשמור חתימה לפני הגשה')
    return
  }
  setSubmitting(true)
  try {
    await submitCommanderSignature(form.commanderId.trim(), form.signatureSvg)
    clearSignaturesCache()
    setSignatureSubmitted(true)
    setExistingSignature(true)
  } catch (err) {
    setError(err instanceof Error ? err.message : 'שגיאה בשליחת החתימה')
  } finally {
    setSubmitting(false)
  }
}
```

- [ ] **Step 4: Add canGenerateLink derived value**

Add this line after `const formStyle = ...`:

```typescript
const canGenerateLink = !!(form.commanderId.trim() && (signatureSubmitted || existingSignature))
```

- [ ] **Step 5: Update handleGenerateLink to remove the signatureSvg check**

The existing `handleGenerateLink` checks `!form.signatureSvg` — replace the whole function:

```typescript
function handleGenerateLink() {
  setError('')
  if (!form.commanderId.trim()) {
    setError('יש למלא את ID המפקד לפני יצירת קישור')
    return
  }

  const config = {
    name: form.name,
    rank: form.rank,
    personalNumber: form.personalNumber,
    commanderId: form.commanderId,
    penColor: form.penColor,
    fontStyle: form.fontStyle,
  }

  const encoded = encodeConfig(config)
  const baseUrl = window.location.origin + window.location.pathname
  const shareUrl = `${baseUrl}#/?c=${encoded}`

  navigator.clipboard.writeText(shareUrl).then(() => {
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 3000)
  }).catch(() => {
    setError('לא הצליח להעתיק קישור')
  })
}
```

- [ ] **Step 6: Update commanderId input to trigger blur check**

Find the commanderId input field (around line 122) and add `onBlur`:

```tsx
<input
  value={form.commanderId}
  onChange={(e) => update('commanderId', e.target.value)}
  onBlur={handleCommanderIdBlur}
  required
/>
```

- [ ] **Step 7: Update the signature section to add "עדכן חתימה" button**

Replace the existing signature section (the block starting `{form.signatureSvg && (`) with:

```tsx
{form.signatureSvg && (
  <>
    <p style={{ color: '#16a34a', fontSize: '0.85rem', marginTop: '0.5rem' }}>✓ חתימה נשמרה</p>

    <button
      type="button"
      onClick={handleCopySignatureBase64}
      aria-label="העתק חתימה base64 לשיתוף ב-WhatsApp"
      style={{
        marginTop: '0.75rem',
        background: '#25D366',
        color: 'white',
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.9rem',
      }}
    >
      {copiedWhatsApp ? '✓ הועתק' : 'העתק חתימה base64'}
    </button>

    <button
      type="button"
      onClick={handleSubmitSignature}
      disabled={submitting}
      style={{
        marginTop: '0.75rem',
        marginRight: '0.5rem',
        background: signatureSubmitted ? '#16a34a' : '#2563eb',
        color: 'white',
        padding: '0.5rem 1rem',
        borderRadius: '0.375rem',
        border: 'none',
        cursor: submitting ? 'not-allowed' : 'pointer',
        fontSize: '0.9rem',
        opacity: submitting ? 0.7 : 1,
      }}
    >
      {submitting ? 'מגיש...' : signatureSubmitted ? '✓ חתימה הוגשה' : 'עדכן חתימה'}
    </button>
  </>
)}
```

- [ ] **Step 8: Update the link generation section**

Replace the second `{form.signatureSvg && (...)}` block (the "שתף קישור" section) with:

```tsx
<div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f0f9ff', borderRadius: '0.5rem' }}>
  <h3 style={{ margin: '0 0 0.5rem 0' }}>שתף קישור עם חיילים</h3>
  <p style={{ color: '#666', fontSize: '0.9rem', margin: '0 0 0.75rem 0' }}>
    {checkingExisting
      ? 'בודק חתימה קיימת...'
      : canGenerateLink
        ? 'חיילים יוכלו לפתוח את הקישור וההפרטים שלך יתמלאו אוטומטית'
        : 'יש להגיש חתימה לפני יצירת קישור'}
  </p>
  <button
    type="button"
    onClick={handleGenerateLink}
    disabled={!canGenerateLink || checkingExisting}
    style={{
      background: canGenerateLink ? '#10b981' : '#9ca3af',
      cursor: canGenerateLink ? 'pointer' : 'not-allowed',
    }}
  >
    {copiedLink ? '✓ הועתק' : 'צור קישור משותף'}
  </button>
</div>
```

- [ ] **Step 9: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 10: Commit**

```bash
git add src/pages/CommanderSetup.tsx
git commit -m "feat: add signature submission and gated link generation in CommanderSetup"
```

---

### Task 4: Update SoldierForm.tsx

**Files:**
- Modify: `src/pages/SoldierForm.tsx`

Replace the static signature lookup with a dynamic fetch from Google Sheets, falling back to the static file on error.

- [ ] **Step 1: Add import for fetchCommanderSignatures**

At the top of `src/pages/SoldierForm.tsx`, replace:
```typescript
import { getSignatureSvg } from '../config/commanderSignatures'
```
with:
```typescript
import { fetchCommanderSignatures } from '../lib/googleSheetsService'
import { getSignatureSvg } from '../config/commanderSignatures'
```

- [ ] **Step 2: Add signaturesLoading state**

Add inside `SoldierForm()` after the existing state declarations:

```typescript
const [signaturesLoading, setSignaturesLoading] = useState(false)
const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
```

(Note: `pdfBlob` state already exists — only add `signaturesLoading` if not already there. Check first.)

- [ ] **Step 3: Replace the URL parsing useEffect**

Replace the existing `// Parse commander from URL on mount` useEffect (lines 87–114) with:

```typescript
// Parse commander from URL on mount — fetch signatures from Sheets with static fallback
useEffect(() => {
  const encodedCommander = searchParams.get('c')
  if (!encodedCommander) return

  const decoded = decodeConfig(encodedCommander)
  if (!decoded) {
    setUrlWarning('לא הצליח לטעון את פרטי המפקד מהקישור. יאפשר לך למלא ידנית.')
    return
  }

  setSignaturesLoading(true)
  fetchCommanderSignatures().then((sheetsSignatures) => {
    // Prefer Sheets data; fall back to static config
    const signatureBase64 = sheetsSignatures?.[decoded.commanderId]
      ?? null

    let signatureSvg = ''
    if (signatureBase64) {
      try {
        signatureSvg = decodeURIComponent(escape(atob(signatureBase64)))
      } catch {
        signatureSvg = ''
      }
    } else {
      // Fall back to static commanderSignatures.ts
      signatureSvg = getSignatureSvg(decoded.commanderId) ?? ''
    }

    setForm((prev) => ({
      ...prev,
      commander: {
        name: decoded.name,
        rank: decoded.rank,
        personalNumber: decoded.personalNumber,
        signatureSvg,
      },
      penColor: decoded.penColor,
      fontStyle: decoded.fontStyle,
    }))
  }).finally(() => {
    setSignaturesLoading(false)
  })
}, [searchParams])
```

- [ ] **Step 4: Show loading indicator while signatures are fetching**

Find where `urlWarning` is rendered in the JSX (search for `urlWarning`) and add a loading indicator nearby:

```tsx
{signaturesLoading && (
  <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>טוען פרטי מפקד...</p>
)}
{urlWarning && <p className="error">{urlWarning}</p>}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 6: Run all tests**

```bash
npm test
```
Expected: all tests pass (25 passing + the new googleSheetsService and googleFormService tests)

- [ ] **Step 7: Commit**

```bash
git add src/pages/SoldierForm.tsx
git commit -m "feat: fetch commander signatures from Google Sheets in SoldierForm"
```

---

## Self-Review

**Spec coverage:**
- ✅ googleFormService submits commanderId + signatureSvg to Google Form
- ✅ googleSheetsService fetches and caches signatures from public CSV
- ✅ Last row wins for duplicate commanderIds
- ✅ CommanderSetup checks existing signature on commanderId blur
- ✅ "עדכן חתימה" button submits signature
- ✅ Link generation gated behind existingSignature || signatureSubmitted
- ✅ SoldierForm fetches from Sheets with static fallback
- ✅ Missing signature → empty string (PDF still generates)

**Placeholder scan:** None found — all steps have complete code.

**Type consistency:**
- `fetchCommanderSignatures()` → `Promise<Record<string, string> | null>` (Tasks 1, 4)
- `submitCommanderSignature(id, svg)` → `Promise<void>` (Tasks 2, 3)
- `clearSignaturesCache()` → `void` (Tasks 1, 3)
- `canGenerateLink` is `boolean` derived in Task 3, used in Task 3 JSX
