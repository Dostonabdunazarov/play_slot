import { parse, format } from 'date-fns'
import { ru } from 'date-fns/locale'

export function formatDate(dateStr: string): string {
  return format(parse(dateStr, 'yyyy-MM-dd', new Date()), 'd MMMM yyyy', { locale: ru })
}

export function phoneLink(phone: string) {
  return `tel:${phone.replace(/\s/g, '')}`
}

// Compact "12 500" style with a thin space as thousands separator.
export function formatMoney(amount: number): string {
  return Math.round(amount).toLocaleString('ru-RU')
}

// Short day label for chart axes, e.g. "13.07".
export function formatDayShort(dateStr: string): string {
  return format(parse(dateStr, 'yyyy-MM-dd', new Date()), 'dd.MM')
}
