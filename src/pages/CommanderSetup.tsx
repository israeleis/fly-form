import { useState, useEffect, type CSSProperties } from 'react'
import { SignaturePad } from '../components/SignaturePad'
import { encodeConfig } from '../lib/configEncoder'
import { FONT_STYLE_OPTIONS, getFontStyleOption } from '../lib/fontStyles'
import { submitCommanderSignature } from '../lib/googleFormService'
import { fetchCommanderSignatures, clearSignaturesCache } from '../lib/googleSheetsService'
import type { PenColor, FontStyle } from '../types'

interface CommanderData {
  name: string
  rank: string
  personalNumber: string
  commanderId: string
  signatureSvg: string
  penColor: PenColor
  fontStyle: FontStyle
}

const PEN_COLORS: { value: PenColor; label: string; hex: string }[] = [
  { value: 'black',     label: 'שחור',    hex: '#171717' },
  { value: 'dark-blue', label: 'כחול כהה', hex: '#0d1b6b' },
  { value: 'blue',      label: 'כחול',    hex: '#1a60d1' },
]

const EMPTY: CommanderData = {
  name: '',
  rank: '',
  personalNumber: '',
  commanderId: '',
  signatureSvg: '',
  penColor: 'black',
  fontStyle: 'rubik',
}

export function CommanderSetup() {
  const [form, setForm] = useState<CommanderData>(EMPTY)
  const [error, setError] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [signatureBase64, setSignatureBase64] = useState('')
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false)
  const [signatureSubmitted, setSignatureSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [existingSignature, setExistingSignature] = useState(false)
  const [checkingExisting, setCheckingExisting] = useState(false)

  function update(field: keyof CommanderData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSignatureSaved(svg: string) {
    update('signatureSvg', svg)
    // Convert SVG to base64
    const base64 = btoa(unescape(encodeURIComponent(svg)))
    setSignatureBase64(base64)
  }

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

  function handleCopySignatureBase64() {
    if (!signatureBase64) return
    navigator.clipboard.writeText(signatureBase64).then(() => {
      setCopiedWhatsApp(true)
      setTimeout(() => setCopiedWhatsApp(false), 3000)
    }).catch(() => {
      setError('לא הצליח להעתיק חתימה')
    })
  }

  async function handleCommanderIdBlur() {
    const id = form.commanderId.trim()
    if (!id) return
    setCheckingExisting(true)
    const signatures = await fetchCommanderSignatures()
    setExistingSignature(signatures !== null && id in signatures)
    setCheckingExisting(false)
  }

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

  const selectedFont = getFontStyleOption(form.fontStyle)
  const formStyle = {
    ['--selected-form-font' as string]: selectedFont.cssFamily,
  } as CSSProperties

  const canGenerateLink = !!(form.commanderId.trim() && (signatureSubmitted || existingSignature))

  return (
    <div className="page">
      <h1>הגדרת מפקד</h1>
      <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
        מלא את הפרטים, בחר סגנון, וחתום. הנתונים יישמרו בקישור משותף.
      </p>
      <form style={formStyle}>
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
            <input value={form.personalNumber} onChange={(e) => update('personalNumber', e.target.value)} required />
          </div>
          <div className="field">
            <label>ID מפקד</label>
            <input
              value={form.commanderId}
              onChange={(e) => update('commanderId', e.target.value)}
              onBlur={handleCommanderIdBlur}
              required
            />
          </div>
        </div>

        <h2>סגנון כתיבה</h2>
        <div className="field">
          <label>בחר פונט</label>
          <div className="font-style-grid" role="radiogroup" aria-label="בחירת פונט">
            {FONT_STYLE_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`font-style-option${form.fontStyle === option.value ? ' selected' : ''}`}
                style={{ ['--font-preview-family' as string]: option.cssFamily } as CSSProperties}
              >
                <input
                  type="radio"
                  name="fontStyle"
                  value={option.value}
                  checked={form.fontStyle === option.value}
                  onChange={() => update('fontStyle', option.value)}
                />
                <span className="font-style-header">
                  <span className="font-style-name">{option.label}</span>
                  <span className="font-style-badge">{option.badge}</span>
                </span>
                <span className="font-style-preview">{option.previewText}</span>
                <span className="font-style-description">{option.description}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="field">
          <label>בחר צבע עט</label>
          <div className="pen-color-row">
            {PEN_COLORS.map(({ value, label, hex }) => (
              <label key={value} className={`pen-color-option${form.penColor === value ? ' selected' : ''}`}>
                <input type="radio" name="penColor" value={value}
                  checked={form.penColor === value}
                  onChange={() => update('penColor', value)} />
                <span className="pen-swatch" style={{ background: hex }} />
                {label}
              </label>
            ))}
          </div>
        </div>

        <h2>חתימה</h2>
        <SignaturePad onSave={handleSignatureSaved} />
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
