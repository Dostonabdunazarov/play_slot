import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { FlagRu, FlagUz } from './flags'

const LANGS = [
  { code: 'ru', label: 'Русский', Flag: FlagRu },
  { code: 'uz', label: "O'zbekcha", Flag: FlagUz },
] as const

export default function LangMenu({
  dark = false,
  placement = 'down',
}: {
  dark?: boolean
  placement?: 'down' | 'up'
}) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    document.documentElement.setAttribute('lang', i18n.language)
  }, [i18n.language])

  const choose = (code: string) => {
    setOpen(false)
    i18n.changeLanguage(code)
    try {
      localStorage.setItem('lang', code)
    } catch {
      return
    }
  }

  const current = LANGS.find((l) => i18n.language?.startsWith(l.code)) ?? LANGS[0]
  const CurrentFlag = current.Flag

  const position =
    placement === 'up' ? 'bottom-full left-0 mb-2 origin-bottom-left' : 'top-full right-0 mt-2 origin-top-right'
  const hidden = placement === 'up' ? 'translate-y-1' : '-translate-y-1'

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('nav.switchLang')}
        title={t('nav.switchLang')}
        className={`inline-flex size-9 items-center justify-center rounded-full transition-colors duration-150 ${
          dark
            ? `text-white/75 hover:bg-white/10 hover:text-white ${open ? 'bg-white/10 text-white' : ''}`
            : `text-ink-2 hover:bg-sunken hover:text-ink ${open ? 'bg-sunken text-ink' : ''}`
        }`}
      >
        <CurrentFlag
          className={`h-4 w-6 rounded-[3px] transition-transform duration-200 ease-out ${
            dark ? 'shadow-[0_0_0_1px_rgb(255_255_255/0.2)]' : 'shadow-[0_0_0_1px_rgb(0_0_0/0.12)]'
          } ${open ? 'scale-110' : ''}`}
        />
      </button>

      <div
        role="menu"
        aria-hidden={!open}
        className={`absolute z-50 w-48 rounded-2xl p-1.5 shadow-float transition-[opacity,transform] duration-200 ease-out ${position} ${
          dark ? 'bg-night-2 ring-1 ring-white/10' : 'bg-surface ring-1 ring-line'
        } ${open ? 'scale-100 translate-y-0 opacity-100' : `pointer-events-none scale-95 opacity-0 ${hidden}`}`}
      >
        {LANGS.map(({ code, label, Flag }, i) => {
          const active = current.code === code
          return (
            <button
              key={code}
              type="button"
              role="menuitemradio"
              aria-checked={active}
              tabIndex={open ? 0 : -1}
              onClick={() => choose(code)}
              style={{ transitionDelay: open ? `${40 + i * 35}ms` : '0ms' }}
              className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[0.9375rem] font-medium transition-[background-color,opacity,transform] duration-200 ${
                open ? 'translate-x-0 opacity-100' : 'translate-x-1 opacity-0'
              } ${
                dark
                  ? `text-white hover:bg-white/8 ${active ? 'bg-white/8' : ''}`
                  : `text-ink hover:bg-sunken ${active ? 'bg-sunken' : ''}`
              }`}
            >
              <Flag className="h-4 w-6 shrink-0 rounded-[3px] shadow-[0_0_0_1px_rgb(0_0_0/0.12)]" />
              <span className="flex-1">{label}</span>
              {active && <Check className={`size-4 ${dark ? 'text-neon' : 'text-accent'}`} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
