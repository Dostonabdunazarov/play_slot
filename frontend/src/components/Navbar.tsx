import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LogOut, Globe, Menu, X } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout, isAdmin } = useAuthStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleLang = () => {
    const next = i18n.language === 'ru' ? 'uz' : 'ru'
    i18n.changeLanguage(next)
    localStorage.setItem('lang', next)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  const adminLinks = [
    { to: '/admin/dashboard', label: t('nav.adminDashboard') },
    { to: '/admin/schedule', label: t('nav.adminSchedule') },
    { to: '/admin/venues', label: t('nav.adminVenues') },
    { to: '/admin/bookings', label: t('nav.adminBookings') },
    { to: '/admin/users', label: t('nav.adminUsers') },
  ]

  const userLinks = [
    { to: '/venues', label: t('nav.venues') },
    { to: '/my-bookings', label: t('nav.myBookings') },
  ]

  const links = isAdmin() ? adminLinks : userLinks

  return (
    <nav className="bg-green-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo + desktop links */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg flex-shrink-0">
              <span>⚽</span>
              <span>BronSlot</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? 'bg-white/20 text-white'
                      : 'text-green-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-green-200 hidden sm:block truncate max-w-[120px]">
              {user?.fullName}
            </span>
            <button
              onClick={toggleLang}
              className="flex items-center gap-1 px-2 py-1.5 rounded-md text-sm text-green-100 hover:bg-white/10 transition-colors"
              title="Сменить язык"
            >
              <Globe className="w-4 h-4" />
              <span className="uppercase font-medium">{i18n.language}</span>
            </button>
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-1 px-2 py-1.5 rounded-md text-sm text-green-100 hover:bg-white/10 transition-colors"
              title={t('auth.logout')}
            >
              <LogOut className="w-4 h-4" />
            </button>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-1.5 rounded-md text-green-100 hover:bg-white/10 transition-colors"
              aria-label="Меню"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-green-700 bg-green-900">
          <div className="px-4 py-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? 'bg-white/20 text-white'
                    : 'text-green-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-green-700 pt-2 mt-2">
              <div className="text-xs text-green-400 px-3 mb-1">{user?.fullName}</div>
              <button
                onClick={() => { setMobileOpen(false); handleLogout() }}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-green-100 hover:bg-white/10 w-full text-left transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {t('auth.logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
