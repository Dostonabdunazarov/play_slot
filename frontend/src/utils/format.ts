import { parse, format } from 'date-fns'
import { ru, uz } from 'date-fns/locale'
import type { Booking } from '../types'

export function dateLocale(lang: string) {
  return lang === 'uz' ? uz : ru
}

export function formatDate(dateStr: string, lang = 'ru'): string {
  return format(parse(dateStr, 'yyyy-MM-dd', new Date()), 'd MMMM yyyy', { locale: dateLocale(lang) })
}

export function formatDateShort(dateStr: string, lang = 'ru'): string {
  return format(parse(dateStr, 'yyyy-MM-dd', new Date()), 'EEEEEE, d MMM', { locale: dateLocale(lang) })
}

export function phoneLink(phone: string) {
  return `tel:${phone.replace(/\s/g, '')}`
}

// Today's local date as yyyy-MM-dd — used as the `min` for date pickers so
// past dates can't be chosen.
export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

// Compact "12 500" style with a thin space as thousands separator.
export function formatMoney(amount: number): string {
  return Math.round(amount).toLocaleString('ru-RU')
}

// Short day label for chart axes, e.g. "13.07".
export function formatDayShort(dateStr: string): string {
  return format(parse(dateStr, 'yyyy-MM-dd', new Date()), 'dd.MM')
}

export function hhmm(time: string): string {
  return time.substring(0, 5)
}

export function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`
}

export function paidAmount(b: Booking): number {
  return b.paymentStatus === 'FullyPaid' ? b.totalAmount : b.prepaymentAmount ?? 0
}

export function remainingAmount(b: Booking): number {
  return b.paymentStatus === 'FullyPaid' ? 0 : b.totalAmount - (b.prepaymentAmount ?? 0)
}

export function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '')
  if (d.length === 12 && d.startsWith('998'))
    return `+998 ${d.slice(3, 5)} ${d.slice(5, 8)} ${d.slice(8, 10)} ${d.slice(10)}`
  return phone
}
