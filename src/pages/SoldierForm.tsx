import { useState, useMemo, useEffect, type CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fillPdf } from '../lib/pdfFiller'
import { calcDays } from '../lib/calcDays'
import { decodeConfig } from '../lib/configEncoder'
import { SoldierFormData, PenColor } from '../types'
import { getFontStyleOption } from '../lib/fontStyles'

const IDF_RANKS: { value: string; label: string }[] = [
  { value: 'טור\'',  label: 'טור\' — טוראי' },
  { value: 'רב"ט',  label: 'רב"ט — רב טוראי' },
  { value: 'סמ\'',   label: 'סמ\' — סמל' },
  { value: 'סמ"ר',  label: 'סמ"ר — סמל ראשון' },
  { value: 'רס"ל',  label: 'רס"ל — רב סמל' },
  { value: 'רס"ר',  label: 'רס"ר — רב סמל ראשון' },
  { value: 'רס"מ',  label: 'רס"מ — רב סמל מתקדם' },
  { value: 'רס"ב',  label: 'רס"ב — רב סמל בכיר' },
  { value: 'סג"מ',  label: 'סג"מ — סגן משנה' },
  { value: 'סגן',   label: 'סגן' },
  { value: 'סרן',   label: 'סרן' },
  { value: 'רס"ן',  label: 'רס"ן — רב סרן' },
  { value: 'סא"ל',  label: 'סא"ל — סגן אלוף' },
  { value: 'אל"מ',  label: 'אל"מ — אלוף משנה' },
  { value: 'אלוף',  label: 'אלוף' },
]

const PEN_COLORS: { value: PenColor; label: string; hex: string }[] = [
  { value: 'black',     label: 'שחור',    hex: '#171717' },
  { value: 'dark-blue', label: 'כחול כהה', hex: '#0d1b6b' },
  { value: 'blue',      label: 'כחול',    hex: '#1a60d1' },
]

const STORAGE_KEY = 'soldierFormData'

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

function loadSaved(): SoldierFormData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { ...EMPTY, ...JSON.parse(raw) }
  } catch {}
  return EMPTY
}

export function SoldierForm() {
  const [form, setForm] = useState<SoldierFormData>(loadSaved)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchParams] = useSearchParams()
  const [urlWarning, setUrlWarning] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [attachmentError, setAttachmentError] = useState('')
  const selectedFont = getFontStyleOption(form.fontStyle)
  const formStyle = {
    ['--selected-form-font' as string]: selectedFont.cssFamily,
  } as CSSProperties

  // Persist every change (excluding commander)
  useEffect(() => {
    const { commander, ...toSave } = form
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
  }, [form])

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

  const stayDays = useMemo(
    () => calcDays(form.departureDate, form.returnDate),
    [form.departureDate, form.returnDate]
  )

  function update<K extends keyof SoldierFormData>(field: K, value: SoldierFormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateStop(index: number, value: string) {
    const stops = [...form.flightRouteStops]
    stops[index] = value
    update('flightRouteStops', stops)
  }

  function addStop() {
    update('flightRouteStops', [...form.flightRouteStops, ''])
  }

  function removeStop(index: number) {
    const stops = form.flightRouteStops.filter((_, i) => i !== index)
    update('flightRouteStops', stops.length > 0 ? stops : [''])
  }

  function handleFileAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setAttachmentError('')

    // Check file type
    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      setAttachmentError('סוג קובץ לא נתמך. השתמש בתמונות JPG/PNG או קובץ PDF.')
      e.target.value = ''
      return
    }

    // Check if already at max
    if (attachments.length >= 3) {
      setAttachmentError('מותר לצרף עד 3 קבצים בלבד.')
      e.target.value = ''
      return
    }

    // Dedup by name and size
    const isDuplicate = attachments.some(
      (f) => f.name === file.name && f.size === file.size
    )
    if (isDuplicate) {
      setAttachmentError('קובץ זה כבר מצורף.')
      e.target.value = ''
      return
    }

    setAttachments((prev) => [...prev, file])
    e.target.value = ''
  }

  function handleFileRemove(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  function handleReset() {
    if (confirm('לאפס את כל השדות?')) {
      localStorage.removeItem(STORAGE_KEY)
      setForm(EMPTY)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.commander) { setError('יש לבחור מפקד'); return }

    setLoading(true)
    try {
      const pdfBytes = await fillPdf(form, attachments)
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `היתר-יציאה-${form.lastName}-${form.firstName}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('אירעה שגיאה ביצירת הטופס. נסה שנית.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>טופס היתר יציאה לחו"ל בשמ"פ</h1>
        <button type="button" className="btn-reset" onClick={handleReset} aria-label="אפס טופס">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          אפס
        </button>
      </div>
      <form onSubmit={handleSubmit} style={formStyle}>


        <h2>1. פרטי משרת המילואים</h2>

        <div className="field">
          <label htmlFor="personalNumber">מספר אישי</label>
          <input id="personalNumber" inputMode="numeric" value={form.personalNumber}
            onChange={(e) => update('personalNumber', e.target.value)} required />
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="lastName">שם משפחה</label>
            <input id="lastName" value={form.lastName}
              onChange={(e) => update('lastName', e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="firstName">שם פרטי</label>
            <input id="firstName" value={form.firstName}
              onChange={(e) => update('firstName', e.target.value)} required />
          </div>
        </div>
        <div className="field">
          <label htmlFor="rank">דרגה</label>
          <select id="rank" value={form.rank}
            onChange={(e) => update('rank', e.target.value)} required>
            <option value="">בחר דרגה</option>
            {IDF_RANKS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="travelPurpose">מטרת נסיעה</label>
          <input id="travelPurpose" value={form.travelPurpose}
            onChange={(e) => update('travelPurpose', e.target.value)} required />
        </div>

        <h2>איש קשר בארץ</h2>

        <div className="form-row">
          <div className="field">
            <label htmlFor="contactLastName">שם משפחה</label>
            <input id="contactLastName" value={form.contactLastName}
              onChange={(e) => update('contactLastName', e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="contactFirstName">שם פרטי</label>
            <input id="contactFirstName" value={form.contactFirstName}
              onChange={(e) => update('contactFirstName', e.target.value)} required />
          </div>
        </div>
        <div className="form-row">
          <div className="field" style={{ flex: 2 }}>
            <label htmlFor="contactStreet">רחוב</label>
            <input id="contactStreet" value={form.contactStreet}
              onChange={(e) => update('contactStreet', e.target.value)} required />
          </div>
          <div className="field house-num">
            <label htmlFor="contactHouseNumber">מס'</label>
            <input id="contactHouseNumber" inputMode="numeric" value={form.contactHouseNumber}
              onChange={(e) => update('contactHouseNumber', e.target.value)} required />
          </div>
          <div className="field" style={{ flex: 1.5 }}>
            <label htmlFor="contactCity">עיר</label>
            <input id="contactCity" value={form.contactCity}
              onChange={(e) => update('contactCity', e.target.value)} required />
          </div>
        </div>
        <div className="field">
          <label htmlFor="contactPhone">טלפון</label>
          <input id="contactPhone" type="tel" inputMode="tel" value={form.contactPhone}
            onChange={(e) => update('contactPhone', e.target.value)} required />
        </div>

        <h2>2. פרטי הבקשה</h2>

        <div className="field">
          <label htmlFor="destinationCountry">מדינת יעד</label>
          <input id="destinationCountry" value={form.destinationCountry}
            onChange={(e) => update('destinationCountry', e.target.value)} required />
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="departureDate">תאריך יציאה</label>
            <input id="departureDate" type="date" value={form.departureDate}
              onChange={(e) => update('departureDate', e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="returnDate">תאריך חזרה</label>
            <input id="returnDate" type="date" value={form.returnDate}
              onChange={(e) => update('returnDate', e.target.value)} required />
          </div>
        </div>
        <div className="field">
          <label>כמות ימי שהייה</label>
          <input value={stayDays > 0 ? String(stayDays) : ''} readOnly
            aria-label="כמות ימי שהייה מחושבת אוטומטית" />
        </div>

        <div className="field">
          <label>מסלול טיסה (כולל קונקשין)</label>
          <div className="stops-list">
            {form.flightRouteStops.map((stop, i) => (
              <div key={i} className="stop-row">
                <input
                  value={stop}
                  placeholder={i === 0 ? 'נקודת מוצא (לדוגמה: תל אביב)' : `עצירה ${i + 1}`}
                  onChange={(e) => updateStop(i, e.target.value)}
                  required={i === 0}
                  aria-label={`עצירה ${i + 1}`}
                />
                {form.flightRouteStops.length > 1 && (
                  <button type="button" className="btn-remove" onClick={() => removeStop(i)}
                    aria-label="הסר עצירה">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn-add-stop" onClick={addStop}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              הוסף עצירה
            </button>
          </div>
        </div>

        {!form.commander && (
          <div className="field" style={{ padding: '1rem', background: '#fef3c7', borderRadius: '0.5rem' }}>
            <p style={{ color: '#78350f', fontSize: '0.9rem', margin: 0 }}>
              💡 קיבלת קישור מפקד? פתח אותו כדי שהפרטים יתמלאו אוטומטית.
            </p>
          </div>
        )}


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

        <h2>קבצים מצורפים (אופציונלי)</h2>
        <div className="field">
          <p className="attachments-hint">עד 3 קבצים (תמונה JPG/PNG או PDF) — יתווספו כעמודים נוספים</p>
          {attachments.length > 0 && (
            <ul className="attachment-list">
              {attachments.map((file, i) => (
                <li key={i} className="attachment-item">
                  <span className="attachment-name" dir="ltr">{file.name}</span>
                  <button type="button" className="btn-remove" onClick={() => handleFileRemove(i)}
                    aria-label={`הסר ${file.name}`}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {attachments.length < 3 && (
            <label className="btn-add-attachment">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              הוסף קובץ
              <input type="file" accept=".jpg,.jpeg,.png,.pdf"
                style={{ display: 'none' }} onChange={handleFileAdd} />
            </label>
          )}
          {attachmentError && <p className="error" role="alert">{attachmentError}</p>}
        </div>

        {urlWarning && <p style={{ color: '#d97706', fontSize: '0.9rem', marginBottom: '1rem' }}>{urlWarning}</p>}
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'מייצר טופס...' : 'הורד טופס ממולא'}
        </button>
      </form>

      {form.commander && (
        <div style={{ textAlign: 'center', marginTop: '1.5rem', color: '#6b7280', fontSize: '0.9rem' }}>
          מפקד: <strong>{form.commander.name}</strong>
        </div>
      )}
    </div>
  )
}
