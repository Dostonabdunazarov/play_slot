import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  addDays,
  addMonths,
  format,
  isBefore,
  isSameMonth,
  isToday,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { dateLocale } from '../utils/format'
import { inputClass } from './ui'

function Calendar({
  value,
  min,
  onSelect,
}: {
  value?: string
  min?: string
  onSelect: (date: string) => void
}) {
  const { t, i18n } = useTranslation()
  const locale = dateLocale(i18n.language)
  const today = startOfDay(new Date())
  const minDate = min ? parseISO(min) : undefined
  const [month, setMonth] = useState(() => startOfMonth(value ? parseISO(value) : today))

  const gridStart = startOfWeek(month, { weekStartsOn: 1 })
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  const weekdays = days.slice(0, 7).map((d) => format(d, 'EEEEEE', { locale }))
  const canPrev = !minDate || isBefore(startOfMonth(minDate), month)
  const title = format(month, 'LLLL yyyy', { locale })

  const nav = 'inline-flex size-8 items-center justify-center rounded-lg text-ink-2 transition-colors hover:bg-sunken hover:text-ink disabled:pointer-events-none disabled:opacity-30'

  return (
    <div className="w-[18.5rem] p-3">
      <div className="mb-2 flex items-center justify-between pl-1.5">
        <span className="text-[0.9375rem] font-semibold text-ink first-letter:uppercase">{title}</span>
        <div className="flex gap-0.5">
          <button type="button" className={nav} disabled={!canPrev} onClick={() => setMonth(addMonths(month, -1))} aria-label={t('schedule.prevMonth')}>
            <ChevronLeft className="size-4.5" />
          </button>
          <button type="button" className={nav} onClick={() => setMonth(addMonths(month, 1))} aria-label={t('schedule.nextMonth')}>
            <ChevronRight className="size-4.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {weekdays.map((w, i) => (
          <span key={w} className={`pb-1.5 text-center text-[0.6875rem] font-semibold uppercase ${i >= 5 ? 'text-due/80' : 'text-ink-3'}`}>
            {w}
          </span>
        ))}
        {days.map((d) => {
          const key = format(d, 'yyyy-MM-dd')
          const outside = !isSameMonth(d, month)
          const disabled = !!minDate && isBefore(d, minDate)
          const selected = key === value
          const current = isToday(d)
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(key)}
              aria-pressed={selected}
              aria-label={format(d, 'EEEE, d MMMM yyyy', { locale })}
              className={`relative flex h-9 items-center justify-center rounded-lg text-sm tabular transition-colors duration-150 disabled:pointer-events-none ${
                selected
                  ? 'bg-brand font-semibold text-white'
                  : current
                    ? 'font-semibold text-accent ring-1 ring-accent/50 ring-inset hover:bg-sunken'
                    : outside
                      ? 'text-ink-3/45 hover:bg-sunken'
                      : 'text-ink hover:bg-sunken'
              } ${disabled ? 'opacity-30' : ''}`}
            >
              {format(d, 'd')}
            </button>
          )
        })}
      </div>

      <div className="mt-2 flex justify-end border-t border-line pt-2">
        <button
          type="button"
          onClick={() => onSelect(format(today, 'yyyy-MM-dd'))}
          className="h-8 rounded-lg px-3 text-sm font-medium text-accent transition-colors hover:bg-sunken"
        >
          {t('schedule.today')}
        </button>
      </div>
    </div>
  )
}

function Popover({
  open,
  onClose,
  align,
  children,
  trigger,
}: {
  open: boolean
  onClose: () => void
  align: string
  children: ReactNode
  trigger: ReactNode
}) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <div ref={rootRef} className="relative">
      {trigger}
      {open && (
        <div
          role="dialog"
          className={`absolute top-full z-50 mt-2 origin-top animate-[popover-in_160ms_var(--ease-out)] rounded-2xl bg-raised shadow-float ring-1 ring-line ${align}`}
        >
          {children}
        </div>
      )}
    </div>
  )
}

export function DatePickerButton({
  value,
  min,
  onChange,
  className,
  label,
  children,
}: {
  value: string
  min?: string
  onChange: (date: string) => void
  className: string
  label: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      align="right-0"
      trigger={
        <button type="button" onClick={() => setOpen((v) => !v)} aria-label={label} title={label} aria-expanded={open} className={className}>
          {children}
        </button>
      }
    >
      <Calendar
        value={value}
        min={min}
        onSelect={(d) => {
          setOpen(false)
          onChange(d)
        }}
      />
    </Popover>
  )
}

export function DateField({
  value,
  onChange,
  placeholder,
  label,
  className = '',
}: {
  value: string
  onChange: (date: string) => void
  placeholder: string
  label: string
  className?: string
}) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const text = value ? format(parseISO(value), 'd MMMM yyyy', { locale: dateLocale(i18n.language) }) : placeholder

  return (
    <Popover
      open={open}
      onClose={() => setOpen(false)}
      align="right-0 sm:right-auto sm:left-0"
      trigger={
        <div className={`relative ${className}`}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={label}
            aria-expanded={open}
            className={`${inputClass} flex w-full items-center gap-2 text-left ${value ? 'pr-9' : ''}`}
          >
            <CalendarDays className="size-4 shrink-0 text-ink-3" />
            <span className={`truncate ${value ? 'text-ink' : 'text-ink-3'}`}>{text}</span>
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label={t('common.reset')}
              className="absolute top-1/2 right-2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      }
    >
      <Calendar
        value={value || undefined}
        onSelect={(d) => {
          setOpen(false)
          onChange(d)
        }}
      />
    </Popover>
  )
}
