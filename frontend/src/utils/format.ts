import { parse, format } from 'date-fns'
import { ru } from 'date-fns/locale'

export function formatDate(dateStr: string): string {
  return format(parse(dateStr, 'yyyy-MM-dd', new Date()), 'd MMMM yyyy', { locale: ru })
}

export function phoneLink(phone: string) {
  return `tel:${phone.replace(/\s/g, '')}`
}
