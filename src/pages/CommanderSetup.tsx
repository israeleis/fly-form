import { useState } from 'react'
import { SignaturePad } from '../components/SignaturePad'
import { encodeConfig } from '../lib/configEncoder'
import { submitCommanderSignature } from '../lib/googleFormService'
import { fetchCommanderSignatures, clearSignaturesCache } from '../lib/googleSheetsService'

interface CommanderData {
  name: string
  rank: string
  personalNumber: string
  signatureSvg: string
}

const EMPTY: CommanderData = {
  name: '',
  rank: '',
  personalNumber: '',
  signatureSvg: '',
}

export function CommanderSetup() {
  const [form, setForm] = useState<CommanderData>(EMPTY)
  const [error, setError] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [signatureSubmitted, setSignatureSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [existingSignature, setExistingSignature] = useState(false)
  const [checkingExisting, setCheckingExisting] = useState(false)

  function update(field: keyof CommanderData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleGenerateLink() {
    setError('')
    if (!form.personalNumber.trim()) {
      setError('יש למלא מספר אישי לפני יצירת קישור')
      return
    }

    const config = {
      name: form.name,
      rank: form.rank,
      personalNumber: form.personalNumber,
      commanderId: form.personalNumber,
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

  async function handlePersonalNumberBlur() {
    const id = form.personalNumber.trim()
    if (!id) return
    setCheckingExisting(true)
    const signatures = await fetchCommanderSignatures()
    setExistingSignature(signatures !== null && id in signatures)
    setCheckingExisting(false)
  }

  async function handleSubmitSignature() {
    setError('')
    if (!form.personalNumber.trim()) {
      setError('יש למלא מספר אישי לפני הגשת חתימה')
      return
    }
    if (!form.signatureSvg) {
      setError('יש לצייר ולשמור חתימה לפני הגשה')
      return
    }
    setSubmitting(true)
    try {
      await submitCommanderSignature(form.personalNumber.trim(), form.signatureSvg)
      clearSignaturesCache()
      setSignatureSubmitted(true)
      setExistingSignature(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשליחת החתימה')
    } finally {
      setSubmitting(false)
    }
  }

  const canGenerateLink = !!(form.personalNumber.trim() && (signatureSubmitted || existingSignature))

  return (
    <div className="page">
      <h1>הגדרת מפקד</h1>
      <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
        מלא את הפרטים וחתום. הנתונים יישמרו בקישור משותף.
      </p>
      <form>
        <div className="form-row">
          <div className="field">
            <label>שם מלא</label>
            <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
          </div>
          <div className="field">
            <label>דרגה</label>
            <input value={form.rank} onChange={(e) => update('rank', e.target.value)} required />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>מספר אישי</label>
            <input
              value={form.personalNumber}
              onChange={(e) => update('personalNumber', e.target.value)}
              onBlur={handlePersonalNumberBlur}
              required
            />
          </div>
        </div>

        <h2>חתימה</h2>
        <SignaturePad onSave={(svg) => update('signatureSvg', svg)} />
        {form.signatureSvg && (
          <>
            <p style={{ color: '#16a34a', fontSize: '0.85rem', marginTop: '0.5rem' }}>✓ חתימה נשמרה</p>
            <button
              type="button"
              onClick={handleSubmitSignature}
              disabled={submitting}
              style={{
                marginTop: '0.75rem',
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

        {error && <p className="error">{error}</p>}
      </form>
    </div>
  )
}
