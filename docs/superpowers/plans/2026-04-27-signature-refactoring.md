# Signature Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split signature handling so commanders share short URLs without embedded signatures, and soldiers load signatures from a static config file based on commander ID.

**Architecture:** Currently signatures are embedded in the encoded URL, making them very long. The refactor moves signatures to a separate `commanderSignatures.ts` file keyed by commander ID. SoldierForm will lookup signatures by ID, CommanderSetup will generate shorter URLs without signatures, and soldiers get shorter shareable links while commanders can still share signature SVGs via WhatsApp.

**Tech Stack:** React, TypeScript, LZ compression for URL encoding

---

## File Structure

**Modified:**
- `src/types.ts` — Remove `signatureSvg` from `CommanderConfig`
- `src/lib/configEncoder.ts` — Update validation to not require `signatureSvg`, add commander ID to encoded config
- `src/pages/CommanderSetup.tsx` — Generate shorter URLs, add base64 conversion and WhatsApp share
- `src/pages/SoldierForm.tsx` — Lookup signature from new config file by commander ID
- `src/lib/pdfFiller.ts` — Make signature parameter optional
- `src/lib/commanderConfigs.ts` — Update predefined configs to not embed signatures

**Created:**
- `src/config/commanderSignatures.ts` — Map of commander ID → SVG string

---

## Tasks

### Task 1: Create commanderSignatures.ts with current signatures

**Files:**
- Create: `src/config/commanderSignatures.ts`

- [ ] **Step 1: Extract current signatures from platoons.json and predefined configs**

We need to gather all current signature SVGs and create a mapping by commander ID. From platoons.json (id: "platoon-example", commander with signatureSvg) and from the script files if they contain signature data.

- [ ] **Step 2: Create the new commanderSignatures file**

```typescript
// src/config/commanderSignatures.ts
// Map of commander ID -> SVG string
// Paste commander signatures here for lookup in SoldierForm

export const COMMANDER_SIGNATURES: Record<string, string> = {
  'israel': '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80"><path d="M10,60 Q50,10 100,50 Q150,90 190,30" stroke="black" stroke-width="2" fill="none"/></svg>',
}

export function getSignatureSvg(commanderId: string): string | undefined {
  return COMMANDER_SIGNATURES[commanderId]
}
```

- [ ] **Step 3: Commit**

```bash
git add src/config/commanderSignatures.ts
git commit -m "feat: create commanderSignatures config for signature lookup"
```

---

### Task 2: Update types.ts to remove signatureSvg from CommanderConfig

**Files:**
- Modify: `src/types.ts:8-15`

- [ ] **Step 1: Read current CommanderConfig type**

Already read, but current structure:
```typescript
export interface CommanderConfig {
  name: string;
  rank: string;
  personalNumber: string;
  signatureSvg: string;  // ← REMOVE THIS
  penColor: PenColor;
  fontStyle: FontStyle;
}
```

- [ ] **Step 2: Remove signatureSvg and add commanderId**

```typescript
export interface CommanderConfig {
  name: string;
  rank: string;
  personalNumber: string;
  commanderId: string;
  penColor: PenColor;
  fontStyle: FontStyle;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "refactor: remove signatureSvg from CommanderConfig, add commanderId"
```

---

### Task 3: Update configEncoder.ts validation

**Files:**
- Modify: `src/lib/configEncoder.ts:35-57`

- [ ] **Step 1: Update validation to require commanderId instead of signatureSvg**

```typescript
export function decodeConfig(encoded: string): CommanderConfig | null {
  try {
    console.log('[decodeConfig] Starting with encoded length:', encoded.length)

    // Convert from URL-safe Base64URL back to Base64
    // Add padding back
    const padding = (4 - (encoded.length % 4)) % 4
    const base64 = encoded
      .replace(/-/g, '+')
      .replace(/_/g, '/') + '='.repeat(padding)

    const json = LZ.decompressFromBase64(base64)
    if (!json) {
      console.warn('[decodeConfig] Decompression returned null')
      return null
    }

    const parsed = JSON.parse(json) as unknown
    console.log('[decodeConfig] Parsed config:', parsed)

    // Validate all required fields exist
    const p = parsed as Record<string, unknown>
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'name' in parsed &&
      'rank' in parsed &&
      'personalNumber' in parsed &&
      'commanderId' in parsed &&
      'penColor' in parsed &&
      'fontStyle' in parsed &&
      typeof p.name === 'string' &&
      typeof p.rank === 'string' &&
      typeof p.personalNumber === 'string' &&
      typeof p.commanderId === 'string' &&
      typeof p.penColor === 'string' &&
      typeof p.fontStyle === 'string' &&
      ['black', 'dark-blue', 'blue'].includes(p.penColor) &&
      ['rubik', 'alef', 'david-libre', 'amatic-sc', 'caveat', 'fredoka-one'].includes(p.fontStyle)
    ) {
      console.log('[decodeConfig] ✓ Config validated:', p.name)
      return parsed as CommanderConfig
    }

    console.warn('[decodeConfig] Validation failed for config')
    return null
  } catch (err) {
    console.error('[decodeConfig] Exception:', err)
    return null
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/configEncoder.ts
git commit -m "refactor: update configEncoder validation for commanderId instead of signatureSvg"
```

---

### Task 4: Update CommanderSetup.tsx to generate shorter URLs

**Files:**
- Modify: `src/pages/CommanderSetup.tsx:7-14, 22-29, 40-67`

- [ ] **Step 1: Update CommanderData interface to not require signatureSvg in encoded config**

```typescript
interface CommanderData {
  name: string
  rank: string
  personalNumber: string
  commanderId: string
  signatureSvg: string
  penColor: PenColor
  fontStyle: FontStyle
}

const EMPTY: CommanderData = {
  name: '',
  rank: '',
  personalNumber: '',
  commanderId: '',
  signatureSvg: '',
  penColor: 'black',
  fontStyle: 'rubik',
}
```

- [ ] **Step 2: Update handleGenerateLink to exclude signature from config**

```typescript
function handleGenerateLink() {
  setError('')
  if (!form.commanderId) {
    setError('יש להזין ID של מפקד')
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

  // Copy to clipboard
  navigator.clipboard.writeText(shareUrl).then(() => {
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 3000)
  }).catch(() => {
    setError('לא הצליח להעתיק קישור')
  })
}
```

- [ ] **Step 3: Add form field for commanderId**

Add a new field in the form (after personalNumber):
```typescript
<div className="form-row">
  <div className="field">
    <label>ID של מפקד</label>
    <input 
      value={form.commanderId} 
      onChange={(e) => update('commanderId', e.target.value)} 
      required 
      placeholder="e.g., 8114-pl_a"
    />
  </div>
</div>
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/CommanderSetup.tsx
git commit -m "refactor: remove signature from generated URL, add commanderId field"
```

---

### Task 5: Add base64 conversion and WhatsApp share to CommanderSetup

**Files:**
- Modify: `src/pages/CommanderSetup.tsx:32-67`

- [ ] **Step 1: Add state for signature base64 and WhatsApp link**

```typescript
const [signatureBase64, setSignatureBase64] = useState('')
const [copiedWhatsApp, setCopiedWhatsApp] = useState(false)
```

- [ ] **Step 2: Convert signature SVG to base64 when saved**

Add a new function:
```typescript
function handleSignatureSaved(svg: string) {
  update('signatureSvg', svg)
  
  // Convert SVG to base64
  const base64 = btoa(unescape(encodeURIComponent(svg)))
  setSignatureBase64(base64)
}
```

- [ ] **Step 3: Add WhatsApp share button after signature section**

Update the SignaturePad call:
```typescript
<SignaturePad onSave={handleSignatureSaved} />
```

And add WhatsApp button after the signature saved indicator:
```typescript
{form.signatureSvg && (
  <>
    <p style={{ color: '#16a34a', fontSize: '0.85rem', marginTop: '0.5rem' }}>✓ חתימה נשמרה</p>
    <div style={{ marginTop: '1rem', padding: '1rem', background: '#e7f5ee', borderRadius: '0.5rem' }}>
      <h3 style={{ margin: '0 0 0.5rem 0' }}>שלח חתימה בWhatsApp</h3>
      <p style={{ color: '#666', fontSize: '0.9rem', margin: '0 0 0.75rem 0' }}>
        השתמש בבסיס64 להעביר את החתימה שלך
      </p>
      <button 
        type="button" 
        onClick={() => {
          navigator.clipboard.writeText(signatureBase64).then(() => {
            setCopiedWhatsApp(true)
            setTimeout(() => setCopiedWhatsApp(false), 3000)
          })
        }} 
        style={{ background: '#25D366' }}
      >
        {copiedWhatsApp ? '✓ הועתק' : 'העתק חתימה base64'}
      </button>
    </div>
  </>
)}
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/CommanderSetup.tsx
git commit -m "feat: add base64 conversion and WhatsApp share for signature"
```

---

### Task 6: Update SoldierForm to lookup signature by commander ID

**Files:**
- Modify: `src/pages/SoldierForm.tsx:87-106`

- [ ] **Step 1: Import signature lookup function**

Add to imports at top:
```typescript
import { getSignatureSvg } from '../config/commanderSignatures'
```

- [ ] **Step 2: Update the URL parsing effect to add signature from config**

Current code (lines 87-106):
```typescript
// Parse commander from URL on mount
useEffect(() => {
  const encodedCommander = searchParams.get('c')
  if (encodedCommander) {
    const decoded = decodeConfig(encodedCommander)
    if (decoded) {
      setForm((prev) => ({
        ...prev,
        commander: decoded,
        penColor: decoded.penColor,
        fontStyle: decoded.fontStyle,
      }))
    } else {
      setUrlWarning('לא הצליח לטעון את פרטי המפקד מהקישור. יאפשר לך למלא ידנית.')
    }
  }
}, [searchParams])
```

Update to:
```typescript
// Parse commander from URL on mount
useEffect(() => {
  const encodedCommander = searchParams.get('c')
  if (encodedCommander) {
    const decoded = decodeConfig(encodedCommander)
    if (decoded) {
      // Lookup signature from static config by commanderId
      const signature = getSignatureSvg(decoded.commanderId)
      const commanderWithSignature = {
        ...decoded,
        signatureSvg: signature || '',
      }
      setForm((prev) => ({
        ...prev,
        commander: commanderWithSignature,
        penColor: decoded.penColor,
        fontStyle: decoded.fontStyle,
      }))
    } else {
      setUrlWarning('לא הצליח לטעון את פרטי המפקד מהקישור. יאפשר לך למלא ידנית.')
    }
  }
}, [searchParams])
```

- [ ] **Step 3: Update SoldierFormData type to allow optional signatureSvg**

Check if `SoldierFormData.commander` needs updating. Since we're setting `signatureSvg` on the commander object, it should already work, but verify the type is compatible.

- [ ] **Step 4: Commit**

```bash
git add src/pages/SoldierForm.tsx
git commit -m "refactor: lookup signature from commanderSignatures config by ID"
```

---

### Task 7: Update types.ts to include signatureSvg in CommanderConfig (for internal use)

**Files:**
- Modify: `src/types.ts:8-15`

- [ ] **Step 1: Re-add signatureSvg as optional for internal use**

Since SoldierForm needs to add the signature after loading from config, we need to keep signatureSvg in the type but as optional:

```typescript
export interface CommanderConfig {
  name: string;
  rank: string;
  personalNumber: string;
  commanderId: string;
  penColor: PenColor;
  fontStyle: FontStyle;
  signatureSvg?: string;  // Added by SoldierForm from commanderSignatures
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "refactor: make signatureSvg optional in CommanderConfig for dynamic loading"
```

---

### Task 8: Update configEncoder validation for optional signatureSvg in encoded data

**Files:**
- Modify: `src/lib/configEncoder.test.ts` (if exists and needs updating)

- [ ] **Step 1: Run existing tests to see if they pass**

```bash
npm test -- configEncoder
```

If tests fail because they expect signatureSvg in the encoded config, update them to use commanderId instead.

- [ ] **Step 2: If tests fail, update test cases**

Change test data from:
```typescript
{
  name: 'test',
  rank: 'sergeant',
  personalNumber: '123',
  signatureSvg: '<svg>...</svg>',
  penColor: 'black',
  fontStyle: 'rubik'
}
```

To:
```typescript
{
  name: 'test',
  rank: 'sergeant',
  personalNumber: '123',
  commanderId: 'test-commander',
  penColor: 'black',
  fontStyle: 'rubik'
}
```

- [ ] **Step 3: Run tests again to verify**

```bash
npm test -- configEncoder
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/configEncoder.test.ts
git commit -m "test: update configEncoder tests for commanderId"
```

---

### Task 9: Verify pdfFiller handles optional signature

**Files:**
- Read: `src/lib/pdfFiller.ts`

- [ ] **Step 1: Check how signature is currently used**

Search for `signatureSvg` in pdfFiller to see if it's required or has fallback logic.

- [ ] **Step 2: If signature is required, add optional handling**

If you see code like:
```typescript
const sig = commander.signatureSvg  // assumes it exists
```

Update to:
```typescript
const sig = commander?.signatureSvg || ''  // optional
```

Or add a guard:
```typescript
if (commander?.signatureSvg) {
  // add signature to PDF
}
```

- [ ] **Step 3: Commit if changes needed**

```bash
git add src/lib/pdfFiller.ts
git commit -m "refactor: make signature optional in PDF generation"
```

---

### Task 10: Update commanderConfigs.ts predefined shortcuts

**Files:**
- Modify: `src/lib/commanderConfigs.ts:4-8`

This file currently has long encoded configs with embedded signatures. We need to update them to not include signatures. However, these are currently pre-encoded, which is harder to modify.

- [ ] **Step 1: Understand current usage**

Check what these configs are used for and where they're referenced (likely RedirectCommander).

- [ ] **Step 2: Decide approach**

Options:
- A) Keep predefined configs but update them to not have signatures (need to re-encode without signatures)
- B) Store just the commander data in this file and let SoldierForm handle the encoding

Recommend Option A if backward compatibility is needed, Option B if we can regenerate all links.

- [ ] **Step 3: Implementation**

If choosing A:
```typescript
export const COMMANDER_CONFIGS: Record<string, string> = {
  'israel': <new-encoded-config-without-signature>,
  '8114-mesayat': <new-encoded-config-without-signature>,
  '8114-pl_a': <new-encoded-config-without-signature>,
}
```

To generate these, you can temporarily modify CommanderSetup to encode and log the config, then paste here.

- [ ] **Step 4: Commit**

```bash
git add src/lib/commanderConfigs.ts
git commit -m "refactor: update predefined commander configs to not include signatures"
```

---

### Task 11: Populate commanderSignatures.ts with commander SVGs

**Files:**
- Modify: `src/config/commanderSignatures.ts`

- [ ] **Step 1: Collect all current signatures**

Extract from the old encoded configs or from commanderSetup when they're created. Commander will send you signatures via WhatsApp as base64, you decode and paste the SVG here.

- [ ] **Step 2: Add signatures to mapping**

```typescript
export const COMMANDER_SIGNATURES: Record<string, string> = {
  'israel': '<svg xmlns="...">...</svg>',
  '8114-mesayat': '<svg xmlns="...">...</svg>',
  '8114-pl_a': '<svg xmlns="...">...</svg>',
}
```

- [ ] **Step 3: Commit**

```bash
git add src/config/commanderSignatures.ts
git commit -m "feat: add commander signature SVGs for production use"
```

---

### Task 12: Manual testing - Commander form to Soldier form flow

**Files:**
- Test: Full integration flow

- [ ] **Step 1: Open CommanderSetup page**

- [ ] **Step 2: Fill in form with test data**
- Name, Rank, Personal Number, CommanderId (use "test-commander")
- Choose font and pen color
- Draw a test signature

- [ ] **Step 3: Copy generated link**

Click "צור קישור משותף" and verify:
- Link is copied to clipboard
- Link is shorter (no embedded signature)
- Link format: `/?c=<encoded-config>`

- [ ] **Step 4: Paste link in browser**

Open new tab, paste the copied URL

- [ ] **Step 5: Verify SoldierForm loads**

- Commander details auto-fill from URL
- If signature exists in commanderSignatures.ts for that ID, it loads
- If signature doesn't exist, signature area is empty
- PDF can still be generated and downloaded

- [ ] **Step 6: Test base64 WhatsApp flow**

Click "העתק חתימה base64" and verify:
- Base64 string is copied to clipboard
- Can be pasted into WhatsApp

---

## Self-Review Checklist

- [ ] Spec coverage: All requirements addressed?
  - ✓ Commander form generates shorter URLs without signature
  - ✓ Base64 conversion for WhatsApp sharing
  - ✓ SoldierForm looks up signature by commander ID
  - ✓ Static config file (commanderSignatures.ts) for signature storage
  - ✓ Signature optional in PDF if missing

- [ ] Placeholder scan: Any TBD, TODO, or incomplete steps?
  - All tasks have complete code blocks
  
- [ ] Type consistency: Do types match across tasks?
  - CommanderConfig has commanderId
  - configEncoder validates commanderId
  - SoldierForm looks up by commanderId
  - CommanderSetup passes commanderId in encoded config

- [ ] File paths: All exact and correct?
  - Verified against current codebase structure
  
- [ ] No breaking changes: Will this work with existing URLs?
  - Old predefined configs in commanderConfigs.ts need updating (Task 10)
  - New URLs will be shorter and not include signatures

