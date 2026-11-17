import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { login } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import Logo from '../components/Logo'
import { Button, Field, inputClass } from '../components/ui'

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

  return (
    <div className="grid min-h-dvh bg-ground lg:grid-cols-[1fr_minmax(0,560px)]">
      <div className="relative hidden overflow-hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1600&q=80"
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-ink/45" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <p className="max-w-md text-3xl font-bold leading-tight tracking-[-0.02em]">{t('auth.tagline')}</p>
          <p className="mt-3 max-w-md text-base text-white/80">{t('auth.taglineSub')}</p>
        </div>
      </div>

      <div className="flex flex-col px-5 pt-5 pb-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <Link
            to="/venues"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
          >
            <ArrowLeft className="size-4" />
            {t('nav.venues')}
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <h1 className="text-[26px] font-bold tracking-[-0.02em] text-ink">{t('auth.loginTitle')}</h1>
          <p className="mt-1.5 text-[15px] text-ink-3">{t('auth.loginSubtitle')}</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Field label={t('auth.email')} htmlFor="email">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                inputMode="email"
                aria-invalid={failed}
                className={`${inputClass} ${failed ? 'border-due' : ''}`}
                placeholder="name@example.com"
              />
            </Field>

            <Field label={t('auth.password')} htmlFor="password">
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  aria-invalid={failed}
                  className={`${inputClass} pr-12 ${failed ? 'border-due' : ''}`}
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
            </Field>

            {failed && (
              <p role="alert" className="rounded-xl bg-due-soft px-3.5 py-2.5 text-sm font-medium text-due">
                {t('auth.loginError')}
              </p>
            )}

            <Button type="submit" size="lg" loading={loading} className="w-full">
              {t('auth.login')}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-ink-3">BronSlot © {new Date().getFullYear()}</p>
      </div>
    </div>
  )
}
