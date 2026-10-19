import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider, useAuth } from './lib/auth'
import { CadastroPage } from './pages/CadastroPage'
import { LoginPage } from './pages/LoginPage'
import { SimuladorPage } from './pages/SimuladorPage'

function Protegida({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useAuth()
  if (carregando) return null
  return usuario ? children : <Navigate to="/entrar" replace />
}

function SoVisitante({ children }: { children: ReactNode }) {
  const { usuario, carregando } = useAuth()
  if (carregando) return null
  return usuario ? <Navigate to="/simulador" replace /> : children
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/entrar" element={<SoVisitante><LoginPage /></SoVisitante>} />
          <Route path="/cadastro" element={<SoVisitante><CadastroPage /></SoVisitante>} />
          <Route path="/simulador" element={<Protegida><SimuladorPage /></Protegida>} />
          <Route path="*" element={<Navigate to="/simulador" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
