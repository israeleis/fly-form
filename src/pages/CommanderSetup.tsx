import { useState } from 'react'
import { SignaturePad } from '../components/SignaturePad'
import { encodeConfig } from '../lib/configEncoder'

const ADMIN_WHATSAPP = 'YOUR_WHATSAPP_NUMBER'

interface CommanderData {
  name: string
  rank: string
  personalNumber: string
  platoonName: string
  signatureSvg: string
}

const EMPTY: CommanderData = {
  name: '',
  rank: '',
  personalNumber: '',
  platoonName: '',
  signatureSvg: '',
}

export function CommanderSetup() {
  const [form, setForm] = useState<CommanderData>(EMPTY)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)

  function update(field: keyof CommanderData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.signatureSvg) {
      setError('יש לצייר ולשמור חתימה לפני השליחה')
      return
    }

    const payload = {
      id: `platoon-${Date.now()}`,
      name: form.platoonName,
      commander: {
        name: form.name,
        rank: form.rank,
        personalNumber: form.personalNumber,
        signatureSvg: form.signatureSvg,
      },
    }

    const text = encodeURIComponent(JSON.stringify(payload, null, 2))
    window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${text}`, '_blank')
    setSent(true)
  }

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

  if (sent) {
    return (
      <div className="page">
        <h1>WhatsApp נפתח</h1>
        <p>אשר את שליחת ההודעה ב-WhatsApp כדי להעביר את הפרטים לאחראי המערכת.</p>
      </div>
    )
  }

  return (
    <div className="page">
      <h1>הגדרת מפקד</h1>
      <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
        מלא את הפרטים וחתום. הנתונים יישלחו לאחראי המערכת דרך WhatsApp.
      </p>
      <form onSubmit={handleSubmit}>
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
            <label>שם פלוגה</label>
            <input value={form.platoonName} onChange={(e) => update('platoonName', e.target.value)} required />
          </div>
        </div>

        <h2>חתימה</h2>
        <SignaturePad onSave={(svg) => update('signatureSvg', svg)} />
        {form.signatureSvg && (
          <p style={{ color: '#16a34a', fontSize: '0.85rem', marginTop: '0.5rem' }}>✓ חתימה נשמרה</p>
        )}

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

        {error && <p className="error">{error}</p>}
        <button type="submit">שלח דרך WhatsApp</button>
      </form>
    </div>
  )
}
