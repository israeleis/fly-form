import { useState } from 'react'
import { SignaturePad } from '../components/SignaturePad'

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

  function update(field: keyof CommanderData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.signatureSvg) {
      alert('יש לצייר ולשמור חתימה לפני השליחה')
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

  if (sent) {
    return (
      <div className="page">
        <h1>נשלח בהצלחה</h1>
        <p>הפרטים נשלחו לאחראי המערכת. הם יתווספו לתצורה בהקדם.</p>
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

        <button type="submit">שלח דרך WhatsApp</button>
      </form>
    </div>
  )
}
