import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore.js'
import { useThemeStore } from './stores/themeStore.js'

import AuthLayout from './layouts/AuthLayout.jsx'
import AppLayout from './layouts/AppLayout.jsx'

import LoginPage from './pages/LoginPage.jsx'
import RegistroPage from './pages/RegistroPage.jsx'
import RecuperarPasswordPage from './pages/RecuperarPasswordPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import CuentasPage from './pages/CuentasPage.jsx'
import TransaccionesPage from './pages/TransaccionesPage.jsx'
import CategoriasPage from './pages/CategoriasPage.jsx'
import DeudasPage from './pages/DeudasPage.jsx'
import DetalleDeudaPage from './pages/DetalleDeudaPage.jsx'
import ContactosPage from './pages/ContactosPage.jsx'
import AsistenteIAPage from './pages/AsistenteIAPage.jsx'
import ConfiguracionPage from './pages/ConfiguracionPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 },
  },
})

function ProtectedRoute({ children }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  if (!accessToken) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  if (accessToken) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  const hydrate = useThemeStore((s) => s.hydrate)
  useEffect(() => { hydrate() }, [hydrate])

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registro" element={<RegistroPage />} />
            <Route path="/recuperar-password" element={<RecuperarPasswordPage />} />
          </Route>

          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/cuentas" element={<CuentasPage />} />
            <Route path="/transacciones" element={<TransaccionesPage />} />
            <Route path="/categorias" element={<CategoriasPage />} />
            <Route path="/deudas" element={<DeudasPage />} />
            <Route path="/deudas/:id" element={<DetalleDeudaPage />} />
            <Route path="/contactos" element={<ContactosPage />} />
            <Route path="/ai" element={<AsistenteIAPage />} />
            <Route path="/configuracion" element={<ConfiguracionPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
