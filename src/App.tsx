import { HashRouter, Routes, Route, Link } from 'react-router-dom'
import { SoldierForm } from './pages/SoldierForm'
import { CommanderSetup } from './pages/CommanderSetup'

export default function App() {
  return (
    <HashRouter>
      <nav style={{
        background: '#1e40af',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        gap: '1.5rem',
        justifyContent: 'flex-end',
      }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '0.9rem' }}>
          טופס חייל
        </Link>
        <Link to="/commander" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.9rem' }}>
          הגדרת מפקד
        </Link>
      </nav>
      <Routes>
        <Route path="/" element={<SoldierForm />} />
        <Route path="/commander" element={<CommanderSetup />} />
      </Routes>
    </HashRouter>
  )
}
