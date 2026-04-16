import { useState, useMemo } from 'react'
import { PlatoonSelect } from '../components/PlatoonSelect'
import { fillPdf } from '../lib/pdfFiller'
import { calcDays } from '../lib/calcDays'
import { SoldierFormData, Platoon } from '../types'
import platoons from '../config/platoons.json'

const EMPTY: SoldierFormData = {
  personalNumber: '',
  lastName: '',
  firstName: '',
  rank: '',
  travelPurpose: '',
  contactLastName: '',
  contactFirstName: '',
  contactAddress: '',
  contactPhone: '',
  destinationCountry: '',
  departureDate: '',
  returnDate: '',
  flightRoute: '',
  platoonId: '',
}

export function SoldierForm() {
  const [form, setForm] = useState<SoldierFormData>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const stayDays = useMemo(
    () => calcDays(form.departureDate, form.returnDate),
    [form.departureDate, form.returnDate]
  )

  function update(field: keyof SoldierFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
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
      <h1>טופס היתר יציאה לחו"ל בשמ"פ</h1>
      <form onSubmit={handleSubmit}>

        <h2>1. פרטי משרת המילואים</h2>
        <div className="form-row">
          <div className="field">
            <label>מספר אישי</label>
            <input value={form.personalNumber} onChange={(e) => update('personalNumber', e.target.value)} required />
          </div>
          <div className="field">
            <label>שם משפחה</label>
            <input value={form.lastName} onChange={(e) => update('lastName', e.target.value)} required />
          </div>
          <div className="field">
            <label>שם פרטי</label>
            <input value={form.firstName} onChange={(e) => update('firstName', e.target.value)} required />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>דרגה</label>
            <input value={form.rank} onChange={(e) => update('rank', e.target.value)} required />
          </div>
          <div className="field">
            <label>מטרת נסיעה</label>
            <input value={form.travelPurpose} onChange={(e) => update('travelPurpose', e.target.value)} required />
          </div>
        </div>

        <h2>איש קשר בארץ</h2>
        <div className="form-row">
          <div className="field">
            <label>שם משפחה</label>
            <input value={form.contactLastName} onChange={(e) => update('contactLastName', e.target.value)} required />
          </div>
          <div className="field">
            <label>שם פרטי</label>
            <input value={form.contactFirstName} onChange={(e) => update('contactFirstName', e.target.value)} required />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>כתובת עדכנית</label>
            <input value={form.contactAddress} onChange={(e) => update('contactAddress', e.target.value)} required />
          </div>
          <div className="field">
            <label>טלפון</label>
            <input type="tel" value={form.contactPhone} onChange={(e) => update('contactPhone', e.target.value)} required />
          </div>
        </div>

        <h2>2. פרטי הבקשה</h2>
        <div className="form-row">
          <div className="field">
            <label>מדינת יעד</label>
            <input value={form.destinationCountry} onChange={(e) => update('destinationCountry', e.target.value)} required />
          </div>
          <div className="field">
            <label>תאריך יציאה</label>
            <input type="date" value={form.departureDate} onChange={(e) => update('departureDate', e.target.value)} required />
          </div>
          <div className="field">
            <label>תאריך חזרה</label>
            <input type="date" value={form.returnDate} onChange={(e) => update('returnDate', e.target.value)} required />
          </div>
          <div className="field">
            <label>כמות ימי שהייה</label>
            <input value={stayDays > 0 ? String(stayDays) : ''} readOnly />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>פירוט מסלול הטיסה (כולל קונקשין)</label>
            <textarea value={form.flightRoute} onChange={(e) => update('flightRoute', e.target.value)} required />
          </div>
        </div>

        <h2>פלוגה</h2>
        <div className="form-row">
          <PlatoonSelect value={form.platoonId} onChange={(id) => update('platoonId', id)} />
        </div>

        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'מייצר טופס...' : 'הורד טופס ממולא'}
        </button>
      </form>
    </div>
  )
}
