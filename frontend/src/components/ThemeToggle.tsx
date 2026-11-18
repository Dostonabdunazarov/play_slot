import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark'

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', theme === 'light' ? '#f3f5f7' : '#080a0f')
  try {
    localStorage.setItem('theme', theme)
  } catch {
    return
  }
}

export default function ThemeToggle() {
  const { t } = useTranslation()
  const [theme, setTheme] = useState<Theme>(() => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'))
  const next: Theme = theme === 'light' ? 'dark' : 'light'
  const label = next === 'light' ? t('nav.lightTheme') : t('nav.darkTheme')

  return (
    <button
      type="button"
      onClick={() => {
        applyTheme(next)
        setTheme(next)
      }}
      aria-label={label}
      title={label}
      className="inline-flex size-9 items-center justify-center rounded-full text-ink-2 transition-colors duration-150 hover:bg-sunken hover:text-ink"
    >
      {theme === 'light' ? <Moon className="size-4.5" /> : <Sun className="size-4.5" />}
    </button>
  )
}
