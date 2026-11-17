import { useEffect, useState } from 'react'
import type { TFunction } from 'i18next'
import { addDays, format } from 'date-fns'
import { formatDateShort, hhmm } from './format'

export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

export function timeRange(start: string, end: string) {
  return `${hhmm(start)}–${hhmm(end)}`
}

export function dayLabel(date: string, t: TFunction, lang: string) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd')
  if (date === today) return t('requests.today')
  if (date === tomorrow) return t('requests.tomorrow')
  return formatDateShort(date, lang)
}

export function reasonLabel(reason: string | null | undefined, t: TFunction) {
  if (!reason) return null
  if (reason === 'slot_taken') return t('requests.reasonSlotTaken')
  if (reason === 'no_answer') return t('requests.reasonNoAnswer')
  return reason
}

export function clockTime(iso: string) {
  return format(new Date(iso), 'HH:mm')
}
