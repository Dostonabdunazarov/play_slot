import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Inbox,
  LogIn,
  LogOut,
  MapPin,
  Ticket,
  Users,
  Warehouse,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { getPendingCount } from '../api/bookingRequests'
import { useRequestTokens } from '../utils/guestRequests'
import Logo from './Logo'
import LangMenu from './LangMenu'

interface NavItem {
  to: string
  label: string
  short: string
  icon: LucideIcon
  badge?: number
}

function usePendingCount() {
  const loggedIn = useAuthStore((s) => s.isAuthenticated())
  const { data } = useQuery({
    queryKey: ['pending-count'],
    queryFn: getPendingCount,
    enabled: loggedIn,
    refetchInterval: 30_000,
  })
  return loggedIn ? data ?? 0 : 0
}

function useNavItems(): NavItem[] {
  const { t } = useTranslation()
  const { isAdmin, isAuthenticated } = useAuthStore()
  const pending = usePendingCount()
  const tokens = useRequestTokens()

  if (!isAuthenticated()) {
    const items: NavItem[] = [{ to: '/venues', label: t('nav.venues'), short: t('nav.venues'), icon: MapPin }]
    if (tokens.length)
      items.push({ to: '/my-requests', label: t('nav.myRequests'), short: t('nav.myRequests'), icon: Ticket })
    return items
  }
  const requests: NavItem = {
    to: '/requests',
    label: t('nav.requests'),
    short: t('nav.short.requests'),
    icon: Inbox,
    badge: pending,
  }
  if (isAdmin()) {
    return [
      requests,
      { to: '/admin/schedule', label: t('nav.adminSchedule'), short: t('nav.short.schedule'), icon: CalendarDays },
      { to: '/admin/bookings', label: t('nav.adminBookings'), short: t('nav.short.bookings'), icon: ClipboardList },
      { to: '/admin/dashboard', label: t('nav.adminDashboard'), short: t('nav.short.dashboard'), icon: BarChart3 },
      { to: '/admin/venues', label: t('nav.venues'), short: t('nav.short.venues'), icon: Warehouse },
      { to: '/admin/users', label: t('nav.adminUsers'), short: t('nav.short.users'), icon: Users },
    ]
  }
  return [
    requests,
    { to: '/venues', label: t('nav.venues'), short: t('nav.venues'), icon: MapPin },
    { to: '/my-bookings', label: t('nav.myBookings'), short: t('nav.short.myBookings'), icon: Ticket },
  ]
}

export function PublicHeader() {
  const { t } = useTranslation()
  const tokens = useRequestTokens()
  const link = ({ isActive }: { isActive: boolean }) =>
    `transition-colors duration-150 ${isActive ? 'text-white' : 'text-white/60 hover:text-white'}`

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ground/80 text-white backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl 2xl:max-w-[100rem] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-9">
          <Link to="/" aria-label="Futsal" className="flex items-center">
            <Logo dark />
          </Link>
          <nav aria-label={t('nav.main')} className="hidden items-center gap-6 text-sm font-medium sm:flex">
            <NavLink to="/venues" className={link}>
              {t('nav.venues')}
            </NavLink>
            {tokens.length > 0 && (
              <NavLink to="/my-requests" className={link}>
                {t('nav.myRequests')}
              </NavLink>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {tokens.length > 0 && (
            <Link
              to="/my-requests"
              aria-label={t('nav.myRequests')}
              className="inline-flex size-9 items-center justify-center rounded-lg text-white/75 transition-colors hover:bg-white/10 hover:text-white sm:hidden"
            >
              <Ticket className="size-4.5" />
            </Link>
          )}
          <LangMenu dark />
          <Link
            to="/login"
            className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
          >
            <LogIn className="size-4" />
            {t('auth.login')}
          </Link>
        </div>
      </div>
    </header>
  )
}

function useLogout() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  return () => {
    logout()
    // Send the now-guest user to the public root (redirects to /venues).
    navigate('/')
  }
}

export function Sidebar() {
  const { t } = useTranslation()
  const items = useNavItems()
  const { user, isAuthenticated } = useAuthStore()
  const loggedIn = isAuthenticated()
  const handleLogout = useLogout()

  return (
    <aside className="sticky top-0 hidden h-dvh w-[15.5rem] shrink-0 flex-col border-r border-line bg-ground/80 backdrop-blur-md lg:flex">
      <div className="flex h-16 items-center px-5">
        <Link to="/" aria-label="Futsal" className="flex items-center">
          <Logo />
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 px-3 pt-2" aria-label={t('nav.main')}>
        {items.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex h-10 items-center gap-3 rounded-xl px-3 text-[0.9375rem] font-medium transition-colors duration-150 ${
                isActive ? 'bg-brand-soft text-brand-ink' : 'text-ink-2 hover:bg-sunken hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`size-4.5 ${isActive ? 'text-accent' : 'text-ink-3'}`} strokeWidth={2} />
                <span className="flex-1">{label}</span>
                {!!badge && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-due px-1.5 text-[0.6875rem] font-bold text-white tabular">
                    {badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="space-y-3 border-t border-line p-4">
        <LangMenu placement="up" />
        {loggedIn ? (
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sunken text-sm font-semibold text-ink-2">
              {user?.fullName?.trim().charAt(0).toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-ink">{user?.fullName}</div>
              <div className="truncate text-xs text-ink-3">
                {user ? t(`users.roles.${user.role.toLowerCase()}`) : ''}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title={t('auth.logout')}
              aria-label={t('auth.logout')}
              className="inline-flex size-9 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
            >
              <LogOut className="size-4.5" />
            </button>
          </div>
        ) : (
          <Link
            to="/login"
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            <LogIn className="size-4" />
            {t('auth.login')}
          </Link>
        )}
      </div>
    </aside>
  )
}

export function TopBar() {
  const { t } = useTranslation()
  const loggedIn = useAuthStore((s) => s.isAuthenticated())
  const handleLogout = useLogout()
  const tokens = useRequestTokens()

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ground/80 backdrop-blur-md lg:hidden">
      <div className="flex h-14 items-center justify-between gap-3 px-4">
        <Link to="/" aria-label="Futsal" className="flex items-center">
          <Logo />
        </Link>
        <div className="flex items-center gap-1.5">
          {!loggedIn && tokens.length > 0 && (
            <Link
              to="/my-requests"
              aria-label={t('nav.myRequests')}
              className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-2 text-sm font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
            >
              <Ticket className="size-4.5" />
              <span className="hidden sm:inline">{t('nav.myRequests')}</span>
            </Link>
          )}
          <LangMenu />
          {loggedIn ? (
            <button
              type="button"
              onClick={handleLogout}
              title={t('auth.logout')}
              aria-label={t('auth.logout')}
              className="inline-flex size-9 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
            >
              <LogOut className="size-4.5" />
            </button>
          ) : (
            <Link
              to="/login"
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              <LogIn className="size-4" />
              {t('auth.login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export function TabBar() {
  const { t } = useTranslation()
  const items = useNavItems()
  const loggedIn = useAuthStore((s) => s.isAuthenticated())
  if (!loggedIn) return null

  return (
    <nav
      aria-label={t('nav.main')}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ground/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto flex max-w-xl">
        {items.map(({ to, short, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex h-16 min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[0.6875rem] font-semibold transition-colors duration-150 ${
                isActive ? 'text-accent' : 'text-ink-3 hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`relative flex h-7 w-12 items-center justify-center rounded-full transition-colors duration-150 ${
                    isActive ? 'bg-brand-soft' : ''
                  }`}
                >
                  <Icon className="size-5" strokeWidth={isActive ? 2.25 : 2} />
                  {!!badge && (
                    <span className="absolute -top-1 right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-due px-1 text-[0.625rem] font-bold text-white tabular">
                      {badge}
                    </span>
                  )}
                </span>
                <span className="max-w-full truncate px-0.5">{short}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
