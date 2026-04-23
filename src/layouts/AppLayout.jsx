import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Wallet, ArrowLeftRight, Tag, HandCoins,
  Users, Bot, Settings, Sun, Moon, LogOut, ChevronDown,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore.js'
import { useThemeStore } from '../stores/themeStore.js'
import { authApi } from '../api/endpoints/auth.js'
import { cn } from '../utils/cn.js'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/cuentas', icon: Wallet, label: 'Cuentas' },
  { to: '/transacciones', icon: ArrowLeftRight, label: 'Transacciones' },
  { to: '/categorias', icon: Tag, label: 'Categorías' },
  { to: '/deudas', icon: HandCoins, label: 'Deudas' },
  { to: '/contactos', icon: Users, label: 'Contactos' },
  { to: '/ai', icon: Bot, label: 'Asistente IA' },
]

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150',
          isActive
            ? 'bg-[var(--sidebar-active-bg)] text-primary'
            : 'text-muted hover:bg-input-bg hover:text-foreground'
        )
      }
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  )
}

export default function AppLayout() {
  const navigate = useNavigate()
  const { user, refreshToken, logout } = useAuthStore()
  const { tema, toggleTema } = useThemeStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropRef = useRef(null)

  useEffect(() => {
    const fn = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropdownOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  async function handleLogout() {
    try { await authApi.logout(refreshToken) } catch {}
    logout()
    navigate('/login')
  }

  const isDark = tema === 'Dark'
  const initials = user?.nombre?.slice(0, 2).toUpperCase() || 'NU'

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-[260px] bg-sidebar-bg border-r border-border flex flex-col z-30">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-border">
          <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white font-black text-sm">N</div>
          <span className="text-lg font-black text-foreground">Nodus</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-4 flex flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => <NavItem key={item.to} {...item} />)}
        </nav>

        {/* Bottom */}
        <div className="px-4 py-4 border-t border-border flex flex-col gap-1">
          <NavItem to="/configuracion" icon={Settings} label="Configuración" />
          <button
            onClick={toggleTema}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-muted hover:bg-input-bg hover:text-foreground transition-all w-full"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            {isDark ? 'Modo claro' : 'Modo oscuro'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="ml-[260px] flex-1 flex flex-col min-h-screen">
        {/* TopBar */}
        <header className="sticky top-0 z-20 bg-card border-b border-border px-6 py-3 flex items-center justify-end">
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 hover:bg-input-bg px-3 py-2 rounded-xl transition-all"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
              <span className="text-sm font-semibold text-foreground hidden sm:block">{user?.nombre}</span>
              <ChevronDown size={14} className="text-muted" />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-lg py-1 z-50">
                <button
                  onClick={() => { setDropdownOpen(false); navigate('/configuracion') }}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-input-bg w-full text-left"
                >
                  <Settings size={15} /> Configuración
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-danger-bg w-full text-left"
                >
                  <LogOut size={15} /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
