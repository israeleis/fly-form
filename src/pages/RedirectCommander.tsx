import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getCommanderConfig } from '../lib/commanderConfigs'

export function RedirectCommander() {
  const { key } = useParams<{ key: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    if (key) {
      const config = getCommanderConfig(key)
      if (config) {
        navigate(`/?c=${config}`)
      } else {
        navigate('/')
      }
    }
  }, [key, navigate])

  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
      <p>טוען...</p>
    </div>
  )
}
