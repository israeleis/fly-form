import platoons from '../config/platoons.json'
import { Platoon } from '../types'

interface Props {
  value: string
  onChange: (platoonId: string) => void
}

export function PlatoonSelect({ value, onChange }: Props) {
  return (
    <div className="field">
      <label htmlFor="platoon">פלוגה</label>
      <select
        id="platoon"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      >
        <option value="">-- בחר פלוגה --</option>
        {(platoons as Platoon[]).map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
    </div>
  )
}
