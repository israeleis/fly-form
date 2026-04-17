import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export function RedirectCommander() {
  const { encoded } = useParams<{ encoded: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    if (encoded) {
      navigate(`/?c=${encoded}`)
    }
  }, [encoded, navigate])

  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
      <p>טוען...</p>
    </div>
  )
}
