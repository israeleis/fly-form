# Google Sheets Signature Integration — Design Spec

## Goal

Replace the static `commanderSignatures.ts` config file with a live Google Sheets backend. Commanders submit their signature via the CommanderSetup form to a Google Form; the SoldierForm fetches all signatures from the linked Google Sheet.

## Architecture

Two new service modules handle all external communication. Components stay focused on UI; services handle data fetching and form submission.

**External URLs:**
- Google Form (write): `https://docs.google.com/forms/d/e/1FAIpQLSeC9zxydP45oPRSFhz0lgOU4rW4dSbAt2hrzE5Tw7P5Fy5ZVw/formResponse`
- Google Sheet (read): `https://docs.google.com/spreadsheets/d/1yk-WBF8nTd3v2QTCx6ovysPlRXLg2_EW3mD6h4Ti2WA/export?format=csv`

---

## Services

### `src/lib/googleFormService.ts`

Submits a commander's ID and signature to the Google Form.

- **Input:** `commanderId: string`, `signatureSvg: string`
- **Behavior:** POST to Google Form `formResponse` endpoint with `mode: 'no-cors'`. Fire-and-forget — no response can be read due to CORS, but submissions reliably arrive.
- **Returns:** `Promise<void>` — resolves after sending regardless of server response.
- **Error handling:** Catches network errors and rethrows with a user-friendly Hebrew message.

Field entry IDs must be discovered by inspecting the Google Form HTML (look for `entry.XXXXXXXXX` input names).

### `src/lib/googleSheetsService.ts`

Fetches all commander signatures from the public Google Sheet.

- **Behavior:** GET the CSV export URL. Parse CSV into `Record<string, string>` mapping `commanderId → signatureSvg`.
- **Multiple entries:** If the same `commanderId` appears more than once, the **last row wins** (most recent submission).
- **Caching:** Result is cached in module-level memory for the browser session. Second call returns cached data.
- **Fallback:** If fetch fails (network error, CORS issue), returns `null` so callers can fall back to static config.
- **Returns:** `Promise<Record<string, string> | null>`

---

## CommanderSetup Changes

### New behavior

1. When `commanderId` field is filled in (on blur or change), check if that ID already exists in the Google Sheet.
2. **Signature exists:** "צור קישור משותף" button is enabled immediately — no resubmission required.
3. **Signature missing:** "צור קישור משותף" button is disabled with message: `"יש להגיש חתימה לפני יצירת קישור"`.
4. Commander can always click **"עדכן חתימה"** to submit/overwrite their signature.
5. After successful submission, "צור קישור משותף" becomes enabled.

### State additions

```typescript
const [signatureSubmitted, setSignatureSubmitted] = useState(false)
const [submitting, setSubmitting] = useState(false)
const [existingSignature, setExistingSignature] = useState(false)
```

### Submission flow

1. Click "עדכן חתימה"
2. Button shows loading: `"מגיש..."`
3. Call `submitCommanderSignature(commanderId, signatureSvg)`
4. On resolve: `setSignatureSubmitted(true)`, button shows `"✓ חתימה הוגשה"`
5. Link generation is now allowed

### Link generation gate

```typescript
const canGenerateLink = form.signatureSvg && (signatureSubmitted || existingSignature)
```

---

## SoldierForm Changes

### Signature loading

1. On mount, call `fetchCommanderSignatures()` from `googleSheetsService`
2. Show brief loading state while fetching
3. On success: use returned map for signature lookup
4. On failure (null returned): fall back to `getSignatureSvg()` from `commanderSignatures.ts`
5. Look up `commanderId` from decoded URL config in the signatures map
6. If found: include `signatureSvg` in commander object
7. If not found: `signatureSvg` is empty string (PDF generates without signature)

### No change to URL format

The URL still encodes `commanderId` — no change to the encoding/decoding logic.

---

## Error Handling

| Scenario | Behavior |
|---|---|
| Sheet fetch fails | Fall back to static `commanderSignatures.ts` |
| Form submit network error | Show Hebrew error, allow retry |
| commanderId not in sheet | Signature empty, PDF still generates |
| commanderId already in sheet | Link allowed without resubmission |

---

## Files

**New:**
- `src/lib/googleFormService.ts`
- `src/lib/googleSheetsService.ts`

**Modified:**
- `src/pages/CommanderSetup.tsx`
- `src/pages/SoldierForm.tsx`

**Unchanged:**
- `src/config/commanderSignatures.ts` — kept as fallback only
- `src/lib/configEncoder.ts` — no changes
- `src/types.ts` — no changes
