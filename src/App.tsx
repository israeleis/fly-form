import { HashRouter, Routes, Route, NavLink, useSearchParams } from 'react-router-dom'
import { SoldierForm } from './pages/SoldierForm'
import { CommanderSetup } from './pages/CommanderSetup'
import { RedirectCommander } from './pages/RedirectCommander'

function NavBar() {
  const [searchParams] = useSearchParams()
  const hasCommanderParam = searchParams.has('c')

  if (hasCommanderParam) {
    return null
  }

  return (
    <nav style={{
      background: '#1e40af',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      gap: '1.5rem',
      justifyContent: 'flex-end',
    }}>
      <NavLink
        to="/"
        end
        style={({ isActive }) => ({
          color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
          textDecoration: 'none',
          fontSize: '0.9rem',
        })}
      >
        טופס חייל
      </NavLink>
      <NavLink
        to="/commander"
        style={({ isActive }) => ({
          color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
          textDecoration: 'none',
          fontSize: '0.9rem',
        })}
      >
        הגדרת מפקד
      </NavLink>
    </nav>
  )
}

export default function App() {
  return (
    <HashRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<SoldierForm />} />
        <Route path="/commander" element={<CommanderSetup />} />
        <Route path="/c/:key" element={<RedirectCommander />} />
      </Routes>
    </HashRouter>
  )
}
