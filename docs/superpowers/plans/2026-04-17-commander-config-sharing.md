# Commander Config Sharing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable commanders to generate shareable URLs with their config embedded and compressed, allowing soldiers to pre-fill read-only commander details.

**Architecture:** Use lz-string for compression + base64 encoding to embed commander config in URL. CommanderSetup generates the link; SoldierForm parses the URL param and populates read-only fields. Remove platoon selection entirely.

**Tech Stack:** lz-string (compression), React Router (URL params), TypeScript

---

## File Structure

- **`src/types.ts`** — Update `SoldierFormData` and add `CommanderConfig` type
- **`src/lib/configEncoder.ts`** — New utility: compress/encode and decode/decompress commander config
- **`src/pages/CommanderSetup.tsx`** — Add link generation UI below WhatsApp section
- **`src/pages/SoldierForm.tsx`** — Parse URL params, conditionally render read-only commander fields
- **`src/lib/pdfFiller.ts`** — Update to accept commander data directly from form
- **`src/components/PlatoonSelect.tsx`** — Remove (no longer needed)
- **`package.json`** — Add `lz-string` dependency

---

## Tasks

### Task 1: Install lz-string dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add lz-string to package.json**

Open `package.json` and add to dependencies:

```json
"lz-string": "^1.5.0"
```

- [ ] **Step 2: Install the package**

```bash
npm install
```

Expected: `lz-string@1.5.0` appears in `node_modules` and `package-lock.json` is updated.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add lz-string for config compression"
```

---

### Task 2: Update types — add CommanderConfig and modify SoldierFormData

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Add CommanderConfig type**

In `src/types.ts`, add before `SoldierFormData`:

```typescript
export interface CommanderConfig {
  name: string;
  rank: string;
  personalNumber: string;
  signatureSvg: string;
}
```

- [ ] **Step 2: Update SoldierFormData to include commander fields**

Replace the `SoldierFormData` interface with:

```typescript
export interface SoldierFormData {
  // Section 1
  personalNumber: string;
  lastName: string;
  firstName: string;
  rank: string;
  travelPurpose: string;
  contactLastName: string;
  contactFirstName: string;
  contactStreet: string;
  contactHouseNumber: string;
  contactCity: string;
  contactPhone: string;
  // Section 2
  destinationCountry: string;
  departureDate: string; // ISO date string YYYY-MM-DD
  returnDate: string;    // ISO date string YYYY-MM-DD
  flightRouteStops: string[];
  // Commander details (from URL or manual entry)
  commander: CommanderConfig | null;
  // PDF appearance
  penColor: PenColor;
  fontStyle: FontStyle;
}
```

- [ ] **Step 3: Verify no compile errors**

```bash
npm run build
```

Expected: Build succeeds with no TypeScript errors in `src/types.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/types.ts
git commit -m "feat: add CommanderConfig type, update SoldierFormData to include commander"
```

---

### Task 3: Create configEncoder utility with tests

**Files:**
- Create: `src/lib/configEncoder.ts`
- Create: `src/lib/configEncoder.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/configEncoder.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { encodeConfig, decodeConfig } from './configEncoder'
import type { CommanderConfig } from '../types'

describe('configEncoder', () => {
  const testConfig: CommanderConfig = {
    name: 'ישראל ישראלי',
    rank: 'סגן',
    personalNumber: '1234567',
    signatureSvg: '<svg>test</svg>',
  }

  it('should encode and decode config without data loss', () => {
    const encoded = encodeConfig(testConfig)
    const decoded = decodeConfig(encoded)
    expect(decoded).toEqual(testConfig)
  })

  it('should produce a URL-safe string', () => {
    const encoded = encodeConfig(testConfig)
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('should handle compression (encoded is shorter than JSON)', () => {
    const encoded = encodeConfig(testConfig)
    const json = JSON.stringify(testConfig)
    expect(encoded.length).toBeLessThan(json.length)
  })

  it('should return null for invalid encoded string', () => {
    const result = decodeConfig('invalid!!!data')
    expect(result).toBeNull()
  })

  it('should return null if decoded JSON is missing required fields', () => {
    const incomplete = { name: 'test' }
    const json = JSON.stringify(incomplete)
    const encoded = Buffer.from(json).toString('base64')
    const result = decodeConfig(encoded)
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test src/lib/configEncoder.test.ts
```

Expected: All tests fail with "encodeConfig is not exported from configEncoder" or similar.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/configEncoder.ts`:

```typescript
import LZ from 'lz-string'
import type { CommanderConfig } from '../types'

export function encodeConfig(config: CommanderConfig): string {
  const json = JSON.stringify(config)
  const compressed = LZ.compressToBase64(json)
  return compressed
}

export function decodeConfig(encoded: string): CommanderConfig | null {
  try {
    const json = LZ.decompressFromBase64(encoded)
    if (!json) return null
    
    const parsed = JSON.parse(json) as unknown
    
    // Validate all required fields exist
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'name' in parsed &&
      'rank' in parsed &&
      'personalNumber' in parsed &&
      'signatureSvg' in parsed &&
      typeof (parsed as Record<string, unknown>).name === 'string' &&
      typeof (parsed as Record<string, unknown>).rank === 'string' &&
      typeof (parsed as Record<string, unknown>).personalNumber === 'string' &&
      typeof (parsed as Record<string, unknown>).signatureSvg === 'string'
    ) {
      return parsed as CommanderConfig
    }
    
    return null
  } catch {
    return null
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test src/lib/configEncoder.test.ts
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/configEncoder.ts src/lib/configEncoder.test.ts
git commit -m "feat: add configEncoder utility for URL-safe compression"
```

---

### Task 4: Add link generation to CommanderSetup page

**Files:**
- Modify: `src/pages/CommanderSetup.tsx`

- [ ] **Step 1: Import encodeConfig and add state for copied feedback**

Update imports at top of file:

```typescript
import { useState } from 'react'
import { encodeConfig } from '../lib/configEncoder'
import { SignaturePad } from '../components/SignaturePad'
```

In the component, add state after `sent` state:

```typescript
const [copiedLink, setCopiedLink] = useState(false)
```

- [ ] **Step 2: Add generateLink function**

Add this function inside `CommanderSetup` component, after `handleSubmit`:

```typescript
function handleGenerateLink() {
  if (!form.signatureSvg) {
    setError('יש לצייר ולשמור חתימה לפני יצירת קישור')
    return
  }

  const config = {
    name: form.name,
    rank: form.rank,
    personalNumber: form.personalNumber,
    signatureSvg: form.signatureSvg,
  }

  const encoded = encodeConfig(config)
  const baseUrl = window.location.origin + window.location.pathname
  const shareUrl = `${baseUrl}#/?commander=${encoded}`

  // Copy to clipboard
  navigator.clipboard.writeText(shareUrl).then(() => {
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 3000)
  }).catch(() => {
    setError('לא הצליח להעתיק קישור')
  })
}
```

- [ ] **Step 3: Add UI to display the link generation button and feedback**

In the JSX, after the signature section and before the error message, add:

```typescript
{form.signatureSvg && (
  <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f0f9ff', borderRadius: '0.5rem' }}>
    <h3 style={{ margin: '0 0 0.5rem 0' }}>שתף קישור עם חיילים</h3>
    <p style={{ color: '#666', fontSize: '0.9rem', margin: '0 0 0.75rem 0' }}>
      חיילים יוכלו לפתוח את הקישור וההפרטים שלך יתמלאו אוטומטית
    </p>
    <button type="button" onClick={handleGenerateLink} style={{ background: '#10b981' }}>
      {copiedLink ? '✓ הועתק' : 'צור קישור משותף'}
    </button>
  </div>
)}
```

- [ ] **Step 4: Test manually in dev**

```bash
npm run dev
```

- Navigate to `/#/commander`
- Fill in a test commander
- Draw a signature
- Click "צור קישור משותף"
- Verify the button shows "✓ הועתק"
- Paste clipboard to check the URL is valid

- [ ] **Step 5: Commit**

```bash
git add src/pages/CommanderSetup.tsx
git commit -m "feat: add shareable link generation to CommanderSetup"
```

---

### Task 5: Update SoldierForm to parse URL params and show read-only commander

**Files:**
- Modify: `src/pages/SoldierForm.tsx`

- [ ] **Step 1: Import useSearchParams and decodeConfig**

Update imports at top:

```typescript
import { useState, useMemo, useEffect, type CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { decodeConfig } from '../lib/configEncoder'
import { fillPdf } from '../lib/pdfFiller'
import { calcDays } from '../lib/calcDays'
import { SoldierFormData, type CommanderConfig, PenColor } from '../types'
import { FONT_STYLE_OPTIONS, getFontStyleOption } from '../lib/fontStyles'
```

Remove the import of `platoons` from `src/config/platoons.json`:

```typescript
// Remove this line:
// import platoons from '../config/platoons.json'
```

- [ ] **Step 2: Update EMPTY constant**

Replace:

```typescript
const EMPTY: SoldierFormData = {
  personalNumber: '',
  lastName: '',
  firstName: '',
  rank: '',
  travelPurpose: '',
  contactLastName: '',
  contactFirstName: '',
  contactStreet: '',
  contactHouseNumber: '',
  contactCity: '',
  contactPhone: '',
  destinationCountry: '',
  departureDate: '',
  returnDate: '',
  flightRouteStops: ['', ''],
  platoonId: '',
  penColor: 'black',
  fontStyle: 'rubik',
}
```

With:

```typescript
const EMPTY: SoldierFormData = {
  personalNumber: '',
  lastName: '',
  firstName: '',
  rank: '',
  travelPurpose: '',
  contactLastName: '',
  contactFirstName: '',
  contactStreet: '',
  contactHouseNumber: '',
  contactCity: '',
  contactPhone: '',
  destinationCountry: '',
  departureDate: '',
  returnDate: '',
  flightRouteStops: ['', ''],
  commander: null,
  penColor: 'black',
  fontStyle: 'rubik',
}
```

- [ ] **Step 3: Add URL param parsing on component mount**

Inside the `SoldierForm` component, after `const [form, setForm] = useState(...)`, add:

```typescript
const [searchParams] = useSearchParams()
const [urlWarning, setUrlWarning] = useState('')

// Parse commander from URL on mount
useEffect(() => {
  const encodedCommander = searchParams.get('commander')
  if (encodedCommander) {
    const decoded = decodeConfig(encodedCommander)
    if (decoded) {
      setForm((prev) => ({ ...prev, commander: decoded }))
    } else {
      setUrlWarning('לא הצליח לטעון את פרטי המפקד מהקישור. יאפשר לך למלא ידנית.')
    }
  }
}, [searchParams])
```

- [ ] **Step 4: Render commander fields as read-only**

Before the "Section 1" heading, add:

```typescript
{form.commander && (
  <div style={{ 
    padding: '1rem', 
    background: '#f3f4f6', 
    borderRadius: '0.5rem', 
    marginBottom: '1.5rem',
    borderLeft: '4px solid #3b82f6'
  }}>
    <h2 style={{ margin: '0 0 1rem 0', color: '#1f2937' }}>פרטי המפקד</h2>
    <div className="form-row">
      <div className="field">
        <label>שם מלא</label>
        <input value={form.commander.name} readOnly style={{ background: '#e5e7eb', cursor: 'not-allowed' }} />
      </div>
      <div className="field">
        <label>דרגה</label>
        <input value={form.commander.rank} readOnly style={{ background: '#e5e7eb', cursor: 'not-allowed' }} />
      </div>
    </div>
    <div className="form-row">
      <div className="field">
        <label>מספר אישי</label>
        <input value={form.commander.personalNumber} readOnly style={{ background: '#e5e7eb', cursor: 'not-allowed' }} />
      </div>
    </div>
    <div className="field">
      <label>חתימה</label>
      <div style={{ padding: '0.75rem', background: 'white', borderRadius: '0.25rem', border: '1px solid #d1d5db' }}>
        <div dangerouslySetInnerHTML={{ __html: form.commander.signatureSvg }} />
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 5: Remove PlatoonSelect usage**

Find the section with `<PlatoonSelect .../>` and replace with:

```typescript
{!form.commander && (
  <div className="field" style={{ padding: '1rem', background: '#fef3c7', borderRadius: '0.5rem' }}>
    <p style={{ color: '#78350f', fontSize: '0.9rem', margin: 0 }}>
      💡 קיבלת קישור מפקד? פתח אותו כדי שהפרטים יתמלאו אוטומטית.
    </p>
  </div>
)}
```

Remove the import of `PlatoonSelect` at the top of the file.

- [ ] **Step 6: Update handleSubmit to use commander from form**

Replace the line:

```typescript
const platoon = (platoons as Platoon[]).find((p) => p.id === form.platoonId)
if (!platoon) { setError('יש לבחור פלוגה'); return }
```

With:

```typescript
if (!form.commander) { setError('יש לבחור מפקד'); return }
```

Update the `fillPdf` call from:

```typescript
const pdfBytes = await fillPdf(form, platoon)
```

To:

```typescript
const pdfBytes = await fillPdf(form)
```

- [ ] **Step 7: Display URL warning if decoding failed**

Before the error display, add:

```typescript
{urlWarning && <p style={{ color: '#d97706', fontSize: '0.9rem', marginBottom: '1rem' }}>{urlWarning}</p>}
```

- [ ] **Step 8: Test manually in dev**

```bash
npm run dev
```

- Navigate to `/#/commander`, fill form, generate a link
- Copy the generated link and open it in a new tab
- Verify commander fields are pre-filled and read-only
- Verify validation error shows if you try to submit without commander

- [ ] **Step 9: Commit**

```bash
git add src/pages/SoldierForm.tsx
git commit -m "feat: parse commander from URL and display as read-only"
```

---

### Task 6: Update pdfFiller to accept commander from form

**Files:**
- Modify: `src/lib/pdfFiller.ts`

- [ ] **Step 1: Check current pdfFiller signature**

```bash
grep -n "export.*function fillPdf" src/lib/pdfFiller.ts
```

- [ ] **Step 2: Update the function signature**

Change from:

```typescript
export async function fillPdf(form: SoldierFormData, platoon: Platoon): Promise<Uint8Array> {
```

To:

```typescript
export async function fillPdf(form: SoldierFormData): Promise<Uint8Array> {
```

- [ ] **Step 3: Replace all `platoon.commander` references with `form.commander`**

Find all instances and replace. For example, if it was:

```typescript
const signature = platoon.commander.signatureSvg
```

Change to:

```typescript
const signature = form.commander?.signatureSvg || ''
```

(Note: TypeScript will error if form.commander is null, but we validate this in SoldierForm before calling fillPdf)

- [ ] **Step 4: Verify no compile errors**

```bash
npm run build
```

- [ ] **Step 5: Test manually**

```bash
npm run dev
```

- Fill soldier form, generate PDF from a URL with commander embedded
- Verify PDF generates correctly and commander details appear

- [ ] **Step 6: Commit**

```bash
git add src/lib/pdfFiller.ts
git commit -m "feat: update pdfFiller to use commander from form instead of platoon lookup"
```

---

### Task 7: Remove PlatoonSelect component

**Files:**
- Delete: `src/components/PlatoonSelect.tsx`

- [ ] **Step 1: Check where PlatoonSelect is used**

```bash
grep -r "PlatoonSelect" src/
```

- [ ] **Step 2: Verify all imports have been removed**

SoldierForm.tsx should no longer import it (done in Task 5). Check if anywhere else uses it. If not:

- [ ] **Step 3: Delete the file**

```bash
rm src/components/PlatoonSelect.tsx
```

- [ ] **Step 4: Run build to verify no broken imports**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add -u
git commit -m "chore: remove PlatoonSelect component (no longer needed)"
```

---

### Task 8: Final integration test and cleanup

**Files:**
- Verify: All files integrate correctly

- [ ] **Step 1: Run full test suite**

```bash
npm run test
```

Expected: All tests pass, including new configEncoder tests.

- [ ] **Step 2: Build the app**

```bash
npm run build
```

Expected: No TypeScript errors, bundle builds successfully.

- [ ] **Step 3: Manual end-to-end test**

```bash
npm run dev
```

- Navigate to `/#/commander`
- Fill in: name="test", rank="סגן", personalNumber="123", sign something
- Click "צור קישור משותף"
- Open the generated URL in a new tab
- Verify commander fields appear pre-filled and read-only
- Fill in soldier details and attempt download
- Verify PDF generates with commander details

- [ ] **Step 4: Check for console warnings**

Browser console should be clean (no errors about missing platoons.json, missing PlatoonSelect, etc.)

- [ ] **Step 5: Commit any final cleanup**

If there were any console warnings or issues, fix them and commit:

```bash
git add .
git commit -m "chore: fix final integration issues"
```

---

## Summary

This plan implements the full config sharing feature:
1. ✅ Compression library added
2. ✅ Types updated (CommanderConfig, SoldierFormData)
3. ✅ Encoder/decoder utility created with tests
4. ✅ Commander link generation UI in CommanderSetup
5. ✅ URL param parsing and read-only display in SoldierForm
6. ✅ PDF generation updated to use form commander data
7. ✅ Old platoon selection removed
8. ✅ Full integration tested
