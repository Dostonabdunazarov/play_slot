import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { addDays, format, isToday, parseISO, differenceInCalendarDays, startOfDay } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { dateLocale } from '../utils/format'
import { DatePickerButton } from './DatePicker'

interface Props {
  value: string
  onChange: (date: string) => void
  allowPast?: boolean
  days?: number
}

export default function DateStrip({ value, onChange, allowPast = false, days = 14 }: Props) {
  const { t, i18n } = useTranslation()
  const locale = dateLocale(i18n.language)
  const scrollerRef = useRef<HTMLDivElement>(null)

  const today = startOfDay(new Date())
  const selected = parseISO(value)
  const defaultStart = allowPast ? addDays(today, -2) : today
  const offset = differenceInCalendarDays(selected, defaultStart)
  const start = offset < 0 || offset >= days ? selected : defaultStart
  const list = Array.from({ length: days }, (_, i) => addDays(start, i))

  useEffect(() => {
    const scroller = scrollerRef.current
    const el = scroller?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (!scroller || !el) return
    scroller.scrollTo({
      left: el.offsetLeft - scroller.offsetLeft - (scroller.clientWidth - el.clientWidth) / 2,
      behavior: 'smooth',
    })
  }, [value])

  return (
    <div className="flex items-stretch gap-2">
      <div
        ref={scrollerRef}
        className="no-scrollbar -mx-1 flex min-w-0 flex-1 snap-x gap-1.5 overflow-x-auto px-1 py-0.5"
      >
        {list.map((d) => {
          const key = format(d, 'yyyy-MM-dd')
          const on = key === value
          const weekend = d.getDay() === 0 || d.getDay() === 6
          return (
            <button
              key={key}
              type="button"
              aria-pressed={on}
              aria-label={format(d, 'EEEE, d MMMM', { locale })}
              onClick={() => onChange(key)}
              className={`flex h-15 w-12 shrink-0 snap-start flex-col items-center justify-center rounded-xl border text-center transition-colors duration-150 ${
                on
                  ? 'border-brand bg-brand text-white'
                  : 'border-line bg-surface text-ink hover:border-line-strong'
              }`}
            >
              <span
                className={`text-[0.6875rem] font-semibold uppercase leading-none ${
                  on ? 'text-white/80' : weekend ? 'text-due' : 'text-ink-3'
                }`}
              >
                {isToday(d) ? t('schedule.todayShort') : format(d, 'EEEEEE', { locale })}
              </span>
              <span className="mt-1.5 text-[1.0625rem] font-bold leading-none tabular">{format(d, 'd')}</span>
            </button>
          )
        })}
      </div>
      <DatePickerButton
        value={value}
        min={allowPast ? undefined : format(today, 'yyyy-MM-dd')}
        onChange={onChange}
        label={t('schedule.selectDate')}
        className="flex h-15 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-ink-2 transition-colors hover:border-line-strong hover:text-ink aria-expanded:border-line-strong aria-expanded:text-ink"
      >
        <CalendarDays className="size-5" />
      </DatePickerButton>
    </div>
  )
}
