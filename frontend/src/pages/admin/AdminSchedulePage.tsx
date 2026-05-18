import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
} from 'date-fns'
import { ChevronLeft, ChevronRight, LayoutGrid, Calendar } from 'lucide-react'
import { getVenues } from '../../api/venues'
import { getBookingsByVenueAndDate, getAllBookings } from '../../api/bookings'
import { formatDate, phoneLink } from '../../utils/format'
import type { Booking, Venue } from '../../types'

type ViewMode = 'table' | 'calendar'

// ─── Table View ─────────────────────────────────────────────────────────────

function paymentColor(status: string) {
  if (status === 'FullyPaid') return 'bg-green-500 text-white'
  if (status === 'Prepaid') return 'bg-yellow-400 text-gray-900'
  return 'bg-gray-400 text-white'
}

function TableView({ date, venues }: { date: string; venues: Venue[] }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Load bookings for all venues on the selected date
  const queries = venues.map((v) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useQuery({
      queryKey: ['bookings', v.id, date],
      queryFn: () => getBookingsByVenueAndDate(v.id, date),
    })
  )

  // Build a map: venueId → hour → booking
  const bookingMap = new Map<string, Map<number, Booking>>()
  venues.forEach((v, i) => {
    const m = new Map<number, Booking>()
    queries[i].data?.forEach((b) => {
      if (b.status === 'Active') m.set(parseInt(b.startTime.substring(0, 2)), b)
    })
    bookingMap.set(v.id, m)
  })

  const allOpenHour = Math.min(...venues.map((v) => parseInt(v.openTime.substring(0, 2))))
  const allCloseHour = Math.max(...venues.map((v) => parseInt(v.closeTime.substring(0, 2))))
  const hours = Array.from({ length: allCloseHour - allOpenHour }, (_, i) => allOpenHour + i)

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="w-20 text-xs text-gray-400 font-normal py-2 pr-3 text-right sticky left-0 bg-white z-10">{t('bookings.startTime')}</th>
            {venues.map((v) => (
              <th key={v.id} className="px-2 py-2 text-center text-xs font-semibold text-gray-700 min-w-[140px]">
                {v.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {hours.map((hour) => {
            const timeLabel = `${String(hour).padStart(2, '0')}:00`
            return (
              <tr key={hour} className="border-t border-gray-50">
                <td className="text-xs text-gray-400 pr-3 py-1 text-right sticky left-0 bg-white z-10 w-20">{timeLabel}</td>
                {venues.map((v) => {
                  const venueOpen = parseInt(v.openTime.substring(0, 2))
                  const venueClose = parseInt(v.closeTime.substring(0, 2))
                  const inRange = hour >= venueOpen && hour < venueClose
                  if (!inRange) {
                    return <td key={v.id} className="px-2 py-1"><div className="h-9 rounded bg-gray-50" /></td>
                  }
                  const booking = bookingMap.get(v.id)?.get(hour)
                  return (
                    <td key={v.id} className="px-2 py-1">
                      {booking ? (
                        <div
                          className={`relative h-9 rounded px-2 flex items-center cursor-default ${paymentColor(booking.paymentStatus)}`}
                          onMouseEnter={() => setHoveredId(booking.id)}
                          onMouseLeave={() => setHoveredId(null)}
                        >
                          <span className="text-xs truncate">{booking.clientName}</span>
                          {hoveredId === booking.id && (
                            <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-1 w-52 bg-gray-900 text-white text-xs rounded-lg p-2.5 shadow-xl pointer-events-none">
                              <div className="font-semibold">{booking.clientName}</div>
                              <a href={phoneLink(booking.clientPhone)} className="text-green-400 hover:underline">{booking.clientPhone}</a>
                              <div className="mt-1 text-gray-400">{t(`bookings.paymentStatuses.${booking.paymentStatus.toLowerCase()}`)}</div>
                              <div className="mt-1.5 border-t border-gray-700 pt-1.5 space-y-0.5">
                                <div className="flex justify-between"><span className="text-gray-400">Итого:</span><span>{booking.totalAmount.toLocaleString()} сум</span></div>
                                <div className="flex justify-between"><span className="text-green-400">Оплачено:</span><span>{(booking.paymentStatus === 'FullyPaid' ? booking.totalAmount : booking.prepaymentAmount ?? 0).toLocaleString()} сум</span></div>
                                <div className="flex justify-between"><span className="text-red-400">Остаток:</span><span>{(booking.paymentStatus === 'FullyPaid' ? 0 : booking.totalAmount - (booking.prepaymentAmount ?? 0)).toLocaleString()} сум</span></div>
                              </div>
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => navigate(`/bookings/new?venueId=${v.id}&date=${date}&hour=${hour}`)}
                          className="w-full h-9 rounded bg-gray-50 hover:bg-green-50 hover:border-green-300 border border-transparent transition-colors text-xs text-gray-300 hover:text-green-500"
                        >
                          +
                        </button>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Calendar View ───────────────────────────────────────────────────────────

function CalendarView({ venues, selectedVenueId }: { venues: Venue[]; selectedVenueId: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  const { data: allBookings = [] } = useQuery({
    queryKey: ['allBookings'],
    queryFn: getAllBookings,
  })

  const venueBookings = selectedVenueId
    ? allBookings.filter((b) => b.venueId === selectedVenueId && b.status === 'Active')
    : allBookings.filter((b) => b.status === 'Active')

  const countByDay = new Map<string, number>()
  venueBookings.forEach((b) => {
    countByDay.set(b.date, (countByDay.get(b.date) ?? 0) + 1)
  })

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const startWeekday = getDay(monthStart)
  const paddingDays = startWeekday === 0 ? 6 : startWeekday - 1

  const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  const expandedVenue = venues.find((v) => v.id === selectedVenueId)
  const expandedBookings = expandedDay
    ? venueBookings.filter((b) => b.date === expandedDay)
    : []

  function paymentBadge(status: string) {
    if (status === 'FullyPaid') return 'bg-green-500'
    if (status === 'Prepaid') return 'bg-yellow-400'
    return 'bg-gray-400'
  }

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="w-5 h-5 text-violet-500" />
        </button>
        <span className="font-semibold text-gray-800 capitalize">
          {format(currentMonth, 'LLLL yyyy')}
        </span>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 hover:bg-gray-100 rounded-lg">
          <ChevronRight className="w-5 h-5 text-violet-500" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className={`text-center text-xs font-medium py-1 ${i >= 5 ? 'text-red-400' : 'text-gray-500'}`}>
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 border-l border-t border-gray-100">
        {Array.from({ length: paddingDays }).map((_, i) => (
          <div key={`pad-${i}`} className="border-r border-b border-gray-100 h-16 bg-gray-50/50" />
        ))}
        {days.map((day) => {
          const dayStr = format(day, 'yyyy-MM-dd')
          const count = countByDay.get(dayStr) ?? 0
          const dow = getDay(day)
          const isWeekend = dow === 0 || dow === 6
          const isExpanded = expandedDay === dayStr

          return (
            <div
              key={dayStr}
              onClick={() => setExpandedDay(isExpanded ? null : dayStr)}
              className={`border-r border-b border-gray-100 h-16 p-1.5 cursor-pointer transition-colors ${
                isExpanded ? 'bg-green-50' : 'hover:bg-gray-50'
              } ${!isSameMonth(day, currentMonth) ? 'opacity-30' : ''}`}
            >
              <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                isToday(day) ? 'bg-green-600 text-white' : isWeekend ? 'text-red-400' : 'text-gray-700'
              }`}>
                {format(day, 'd')}
              </div>
              {count > 0 && (
                <div className="flex gap-0.5 flex-wrap">
                  {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  ))}
                  {count > 4 && <span className="text-xs text-gray-400 leading-none">+{count - 4}</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Expanded day timeline */}
      {expandedDay && (
        <div className="mt-4 bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-gray-800">{expandedDay ? formatDate(expandedDay) : ''}</div>
            {expandedVenue && (
              <span className="text-xs text-green-700">{expandedVenue.name}</span>
            )}
          </div>
          {!expandedBookings.length ? (
            <p className="text-sm text-gray-400">{t('bookings.noBookings')}</p>
          ) : (
            <div className="space-y-2">
              {expandedBookings
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((b) => (
                  <div key={b.id} className={`px-3 py-2 rounded-lg ${paymentBadge(b.paymentStatus)} bg-opacity-20`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${paymentBadge(b.paymentStatus)}`} />
                      <span className="text-xs font-mono text-gray-700">{b.startTime.substring(0, 5)}–{b.endTime.substring(0, 5)}</span>
                      <span className="text-sm font-medium text-gray-900 flex-1">{b.clientName}</span>
                      <a href={phoneLink(b.clientPhone)} className="text-xs text-green-700 hover:underline">{b.clientPhone}</a>
                    </div>
                    <div className="flex gap-4 mt-1 ml-5 text-xs">
                      <span className="text-gray-500">Итого: <span className="font-medium text-gray-700">{b.totalAmount.toLocaleString()} сум</span></span>
                      <span className="text-green-700">Оплачено: <span className="font-medium">{(b.paymentStatus === 'FullyPaid' ? b.totalAmount : b.prepaymentAmount ?? 0).toLocaleString()} сум</span></span>
                      <span className="text-red-600">Остаток: <span className="font-medium">{(b.paymentStatus === 'FullyPaid' ? 0 : b.totalAmount - (b.prepaymentAmount ?? 0)).toLocaleString()} сум</span></span>
                    </div>
                  </div>
                ))}
            </div>
          )}
          {expandedVenue && (
            <button
              onClick={() => navigate(`/bookings/new?venueId=${expandedVenue.id}&date=${expandedDay}&hour=${parseInt(expandedVenue.openTime)}`)}
              className="mt-3 text-xs text-green-700 hover:text-green-900 underline"
            >
              + {t('bookings.newBooking')}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminSchedulePage() {
  const { t } = useTranslation()
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selectedVenueId, setSelectedVenueId] = useState('')

  const { data: venues = [], isLoading } = useQuery({ queryKey: ['venues'], queryFn: getVenues })

  if (isLoading) return <div className="text-center py-20 text-gray-500">{t('common.loading')}</div>

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('schedule.title')}</h1>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Date (table view only) */}
          {viewMode === 'table' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          )}

          {/* Venue filter (calendar view) */}
          {viewMode === 'calendar' && (
            <select
              value={selectedVenueId}
              onChange={(e) => setSelectedVenueId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">{t('schedule.allVenues')}</option>
              {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          )}

          {/* View toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-white shadow-sm text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4 text-blue-500" />
              {t('schedule.tableView')}
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ${
                viewMode === 'calendar' ? 'bg-white shadow-sm text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4 text-violet-500" />
              {t('schedule.calendarView')}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        {viewMode === 'table' ? (
          <TableView date={selectedDate} venues={venues} />
        ) : (
          <CalendarView venues={venues} selectedVenueId={selectedVenueId} />
        )}
      </div>
    </div>
  )
}
