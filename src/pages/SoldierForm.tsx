import { useState, useMemo, useEffect, type CSSProperties } from 'react'
import { PlatoonSelect } from '../components/PlatoonSelect'
import { fillPdf } from '../lib/pdfFiller'
import { calcDays } from '../lib/calcDays'
import { SoldierFormData, Platoon, PenColor } from '../types'
import { FONT_STYLE_OPTIONS, getFontStyleOption } from '../lib/fontStyles'
import platoons from '../config/platoons.json'

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
  platoonId: '',
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
  const selectedFont = getFontStyleOption(form.fontStyle)
  const formStyle = {
    ['--selected-form-font' as string]: selectedFont.cssFamily,
  } as CSSProperties

  // Persist every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
  }, [form])

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

  function handleReset() {
    if (confirm('לאפס את כל השדות?')) {
      localStorage.removeItem(STORAGE_KEY)
      setForm(EMPTY)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const platoon = (platoons as Platoon[]).find((p) => p.id === form.platoonId)
    if (!platoon) { setError('יש לבחור פלוגה'); return }

    setLoading(true)
    try {
      const pdfBytes = await fillPdf(form, platoon)
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

        <h2>פלוגה</h2>
        <div className="field">
          <PlatoonSelect value={form.platoonId} onChange={(id) => update('platoonId', id)} />
        </div>

        <h2>סגנון כתיבה בטופס</h2>
        <div className="field">
          <label>בחר פונט</label>
          <div className="font-style-grid" role="radiogroup" aria-label="בחירת פונט לטופס">
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

        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'מייצר טופס...' : 'הורד טופס ממולא'}
        </button>
      </form>
    </div>
  )
}
