import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react'
import { login } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import Logo, { LogoMark } from '../components/Logo'
import PitchBackdrop from '../components/PitchBackdrop'

export default function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFailed(false)
    try {
      const data = await login({ email, password })
      setAuth(data.token, data.user)
      if (data.user.role === 'Admin') {
        navigate('/admin/schedule')
      } else {
        navigate('/venues')
      }
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }

  const darkInput =
    'block h-12 w-full rounded-[10px] border border-line bg-surface px-4 text-[0.9375rem] text-ink transition-[border-color,box-shadow] duration-150 placeholder:text-ink-3/70 hover:border-line-strong focus:border-accent focus:ring-3 focus:ring-accent/20 focus:outline-none'

  return (
    <div className="relative min-h-dvh overflow-hidden bg-ground text-ink">
      <PitchBackdrop />
      <div aria-hidden className="glow-brand pointer-events-none absolute inset-x-0 top-0 h-96" />

      <div className="relative mx-auto flex min-h-dvh max-w-7xl 2xl:max-w-[100rem] flex-col px-5 pt-5 pb-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="Futsal">
            <Logo />
          </Link>
          <Link
            to="/venues"
            className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-2.5 text-sm font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
          >
            <ArrowLeft className="size-4" />
            {t('auth.toVenues')}
          </Link>
        </div>

        <div className="flex flex-1 items-center lg:justify-between">
          <div className="hidden max-w-lg flex-1 lg:block">
            <p className="text-5xl leading-[1.08] font-bold tracking-tight">
              {t('auth.staffTagline')} <span className="gradient-text">{t('auth.staffTaglineAccent')}</span>
            </p>
            <p className="mt-4 text-base text-ink-3">{t('auth.staffTaglineSub')}</p>
          </div>

          <div className="mx-auto my-10 w-full max-w-md rounded-2xl border border-line bg-raised/60 p-6 shadow-float backdrop-blur-xl backdrop-saturate-150 sm:p-8 lg:mx-0 lg:ml-16">
            <LogoMark className="mb-6 size-14" />
            <h1 className="text-2xl font-semibold tracking-tight">{t('auth.staffTitle')}</h1>
            <p className="mt-1.5 text-sm text-ink-3">{t('auth.staffSub')}</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-2">
                  {t('auth.email')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  inputMode="email"
                  aria-invalid={failed}
                  className={`${darkInput} ${failed ? 'border-due' : ''}`}
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink-2">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    aria-invalid={failed}
                    className={`${darkInput} pr-12 ${failed ? 'border-due' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t('users.hidePassword') : t('users.showPassword')}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-ink-3 transition-colors hover:text-ink"
                  >
                    {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                  </button>
                </div>
              </div>

              {failed && (
                <p role="alert" className="rounded-xl bg-due/20 px-3.5 py-2.5 text-sm font-medium text-due-ink ring-1 ring-due/50">
                  {t('auth.loginError')}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="gradient-brand inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] text-[0.9375rem] font-semibold text-white shadow-sm transition-[filter] duration-150 hover:brightness-110 active:brightness-95 disabled:opacity-60"
              >
                {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
                {t('auth.login')}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center text-xs text-ink-3 lg:text-right">Futsal © {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
