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
import { CalendarDays, ChevronLeft, ChevronRight, Hourglass, LayoutGrid, Phone, Plus, Warehouse } from 'lucide-react'
import { getVenues } from '../../api/venues'
import { getBookingsByVenueAndDate, getAllBookings } from '../../api/bookings'
import { dateLocale, formatDate, hhmm, hourLabel, phoneLink } from '../../utils/format'
import DateStrip from '../../components/DateStrip'
import {
  Card,
  EmptyState,
  IconButton,
  MoneyLine,
  PageHeader,
  PaymentBadge,
  Segmented,
  Sheet,
  Skeleton,
  inputClass,
} from '../../components/ui'
import { buttonClass, paymentDotClass } from '../../components/styles'
import type { Booking, PaymentStatus, Venue } from '../../types'

type ViewMode = 'table' | 'calendar'

const cellTone: Record<PaymentStatus, string> = {
  FullyPaid: 'bg-paid-soft hover:bg-paid-soft-hover',
  Prepaid: 'bg-pre-soft hover:bg-pre-soft-hover',
  Unpaid: 'bg-due-soft hover:bg-due-soft-hover',
}

function BookingSheet({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const { t, i18n } = useTranslation()
  return (
    <Sheet
      title={booking.clientName}
      onClose={onClose}
      footer={
        <a href={phoneLink(booking.clientPhone)} className={buttonClass('primary', 'lg', 'flex-1')}>
          <Phone className="size-4" />
          <span className="tabular">{booking.clientPhone}</span>
        </a>
      }
    >
      <div className="space-y-4">
        <div className="text-sm text-ink-2">
          <div className="font-semibold text-ink">{booking.venueName}</div>
          <div className="tabular">
            {formatDate(booking.date, i18n.language)} · {hhmm(booking.startTime)}–{hhmm(booking.endTime)}
          </div>
        </div>
        <PaymentBadge status={booking.paymentStatus} />
        <MoneyLine booking={booking} className="rounded-xl bg-sunken px-3 py-2.5" />
        {booking.notes && <p className="text-sm text-ink-2">{booking.notes}</p>}
        {booking.createdByName && (
          <p className="text-xs text-ink-3">
            {t('bookings.createdBy')}: {booking.createdByName}
          </p>
        )}
      </div>
    </Sheet>
  )
}

// ─── Table View ─────────────────────────────────────────────────────────────

function TableView({ date, venues }: { date: string; venues: Venue[] }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [openBooking, setOpenBooking] = useState<Booking | null>(null)
  const [now] = useState(() => Date.now())

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
      if (b.status === 'Active' || b.status === 'Pending') m.set(parseInt(b.startTime.substring(0, 2)), b)
    })
    bookingMap.set(v.id, m)
  })

  const allOpenHour = Math.min(...venues.map((v) => parseInt(v.openTime.substring(0, 2))))
  const allCloseHour = Math.max(...venues.map((v) => parseInt(v.closeTime.substring(0, 2))))
  const hours = Array.from({ length: allCloseHour - allOpenHour }, (_, i) => allOpenHour + i)
  const loading = queries.some((q) => q.isLoading)

  return (
    <>
      <div className="-mx-4 overflow-x-auto sm:mx-0">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky top-0 left-0 z-20 w-16 border-b border-line bg-surface py-2.5 pr-2 pl-4 text-left text-xs font-semibold text-ink-3 sm:pl-0">
                {t('bookings.time')}
              </th>
              {venues.map((v) => (
                <th
                  key={v.id}
                  className="sticky top-0 z-10 min-w-[9.25rem] border-b border-line bg-surface px-1.5 py-2.5 text-left text-[0.8125rem] font-semibold text-ink"
                >
                  <span className="block truncate">{v.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map((hour) => {
              const past = new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`).getTime() < now
              return (
                <tr key={hour}>
                  <td className="sticky left-0 z-10 bg-surface py-1 pr-2 pl-4 align-middle text-[0.8125rem] font-semibold text-ink-2 tabular sm:pl-0">
                    {hourLabel(hour)}
                  </td>
                  {venues.map((v) => {
                    const venueOpen = parseInt(v.openTime.substring(0, 2))
                    const venueClose = parseInt(v.closeTime.substring(0, 2))
                    const inRange = hour >= venueOpen && hour < venueClose
                    if (!inRange) {
                      return (
                        <td key={v.id} className="px-1 py-1">
                          <div className="h-11 rounded-lg bg-sunken/60" />
                        </td>
                      )
                    }
                    if (loading) {
                      return (
                        <td key={v.id} className="px-1 py-1">
                          <Skeleton className="h-11 rounded-lg" />
                        </td>
                      )
                    }
                    const booking = bookingMap.get(v.id)?.get(hour)
                    return (
                      <td key={v.id} className="px-1 py-1">
                        {booking?.status === 'Pending' ? (
                          <button
                            type="button"
                            onClick={() => booking.bookingRequestId && navigate(`/requests/${booking.bookingRequestId}`)}
                            className="hatch flex h-11 w-full items-center gap-2 rounded-lg border border-wait-line px-2.5 text-left text-wait transition-colors duration-150 hover:border-wait-dot"
                          >
                            <Hourglass className="size-3.5 shrink-0" />
                            <span className="truncate text-[0.8125rem] font-semibold">{booking.clientName}</span>
                          </button>
                        ) : booking ? (
                          <button
                            type="button"
                            onClick={() => setOpenBooking(booking)}
                            className={`flex h-11 w-full items-center gap-2 rounded-lg px-2.5 text-left transition-colors duration-150 ${cellTone[booking.paymentStatus]}`}
                          >
                            <span className={`size-1.5 shrink-0 rounded-full ${paymentDotClass(booking.paymentStatus)}`} />
                            <span className="truncate text-[0.8125rem] font-semibold text-ink">{booking.clientName}</span>
                          </button>
                        ) : past ? (
                          <div className="h-11 rounded-lg border border-dashed border-line" />
                        ) : (
                          <button
                            type="button"
                            aria-label={`${v.name}, ${hourLabel(hour)} — ${t('bookings.book')}`}
                            onClick={() => navigate(`/bookings/new?venueId=${v.id}&date=${date}&hour=${hour}`)}
                            className="group flex h-11 w-full items-center justify-center rounded-lg border border-dashed border-line-strong text-ink-3 transition-colors duration-150 hover:border-brand hover:bg-brand-soft hover:text-accent"
                          >
                            <Plus className="size-4 opacity-60 group-hover:opacity-100" />
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
      {openBooking && <BookingSheet booking={openBooking} onClose={() => setOpenBooking(null)} />}
    </>
  )
}

// ─── Calendar View ───────────────────────────────────────────────────────────

function CalendarView({ venues, selectedVenueId }: { venues: Venue[]; selectedVenueId: string }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const locale = dateLocale(i18n.language)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  const { data: allBookings = [], isLoading } = useQuery({
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

  const weekdays = Array.from({ length: 7 }, (_, i) =>
    format(new Date(2024, 0, 1 + i), 'EEEEEE', { locale })
  )

  const expandedVenue = venues.find((v) => v.id === selectedVenueId)
  const expandedBookings = expandedDay
    ? venueBookings.filter((b) => b.date === expandedDay)
    : []

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <IconButton label={t('schedule.prevMonth')} onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="size-5" />
        </IconButton>
        <span className="text-base font-bold capitalize text-ink">
          {format(currentMonth, 'LLLL yyyy', { locale })}
        </span>
        <IconButton label={t('schedule.nextMonth')} onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="size-5" />
        </IconButton>
      </div>

      <div className="mb-1 grid grid-cols-7">
        {weekdays.map((d, i) => (
          <div
            key={d}
            className={`py-1 text-center text-xs font-semibold uppercase ${i >= 5 ? 'text-due' : 'text-ink-3'}`}
          >
            {d}
          </div>
        ))}
      </div>

      <div className={`grid grid-cols-7 gap-1 ${isLoading ? 'opacity-50' : ''}`}>
        {Array.from({ length: paddingDays }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const dayStr = format(day, 'yyyy-MM-dd')
          const count = countByDay.get(dayStr) ?? 0
          const isExpanded = expandedDay === dayStr
          const today = isToday(day)

          return (
            <button
              key={dayStr}
              type="button"
              aria-pressed={isExpanded}
              onClick={() => setExpandedDay(isExpanded ? null : dayStr)}
              className={`flex h-14 flex-col items-center justify-center gap-1 rounded-xl border transition-colors duration-150 sm:h-16 ${
                isExpanded
                  ? 'border-brand bg-brand-soft'
                  : 'border-transparent hover:bg-sunken'
              } ${!isSameMonth(day, currentMonth) ? 'opacity-30' : ''}`}
            >
              <span
                className={`flex size-7 items-center justify-center rounded-full text-sm font-semibold tabular ${
                  today ? 'bg-brand text-white' : 'text-ink'
                }`}
              >
                {format(day, 'd')}
              </span>
              <span
                className={`h-4 min-w-4 rounded-full px-1 text-[0.6875rem] font-bold leading-4 tabular ${
                  count ? 'bg-accent text-neon-ink' : 'text-transparent'
                }`}
              >
                {count || 0}
              </span>
            </button>
          )
        })}
      </div>

      {expandedDay && (
        <div className="mt-4 border-t border-line pt-4">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <div className="font-bold text-ink">{formatDate(expandedDay, i18n.language)}</div>
            {expandedVenue && <span className="truncate text-sm text-ink-3">{expandedVenue.name}</span>}
          </div>
          {!expandedBookings.length ? (
            <p className="py-2 text-sm text-ink-3">{t('bookings.noBookings')}</p>
          ) : (
            <ul className="space-y-2">
              {expandedBookings
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map((b) => (
                  <li key={b.id} className="rounded-xl bg-sunken px-3.5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-[5.375rem] shrink-0 text-sm font-semibold text-ink tabular">
                        {hhmm(b.startTime)}–{hhmm(b.endTime)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{b.clientName}</span>
                      <PaymentBadge status={b.paymentStatus} />
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 pl-0 text-sm sm:pl-[6.125rem]">
                      {!selectedVenueId && <span className="text-ink-3">{b.venueName}</span>}
                      <a href={phoneLink(b.clientPhone)} className="text-accent tabular hover:underline">
                        {b.clientPhone}
                      </a>
                    </div>
                    <MoneyLine booking={b} className="mt-2 sm:pl-[6.125rem]" />
                  </li>
                ))}
            </ul>
          )}
          {expandedVenue && (
            <button
              type="button"
              onClick={() => navigate(`/bookings/new?venueId=${expandedVenue.id}&date=${expandedDay}&hour=${parseInt(expandedVenue.openTime)}`)}
              className={buttonClass('secondary', 'sm', 'mt-3')}
            >
              <Plus className="size-4" />
              {t('bookings.newBooking')}
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

  return (
    <div>
      <PageHeader
        title={t('schedule.title')}
        actions={
          <Segmented
            label={t('schedule.view')}
            value={viewMode}
            onChange={setViewMode}
            options={[
              { value: 'table', label: <><LayoutGrid className="size-4" />{t('schedule.tableView')}</> },
              { value: 'calendar', label: <><CalendarDays className="size-4" />{t('schedule.calendarView')}</> },
            ]}
          />
        }
      />

      {isLoading ? (
        <Skeleton className="h-[32.5rem] rounded-2xl" />
      ) : !venues.length ? (
        <Card>
          <EmptyState icon={<Warehouse className="size-6" />} title={t('venues.noVenues')} text={t('venues.noVenuesHint')} />
        </Card>
      ) : (
        <Card className="p-4 lg:p-5">
          {viewMode === 'table' ? (
            <>
              <div className="mb-4">
                <DateStrip value={selectedDate} onChange={setSelectedDate} allowPast />
              </div>
              <TableView date={selectedDate} venues={venues} />
            </>
          ) : (
            <>
              <select
                value={selectedVenueId}
                onChange={(e) => setSelectedVenueId(e.target.value)}
                aria-label={t('bookings.venue')}
                className={`${inputClass} mb-4 sm:max-w-xs`}
              >
                <option value="">{t('schedule.allVenues')}</option>
                {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
              <CalendarView venues={venues} selectedVenueId={selectedVenueId} />
            </>
          )}
        </Card>
      )}
    </div>
  )
}
