import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { ArrowLeft, ChevronDown, Clock, MapPin, Phone, Plus, SearchX } from 'lucide-react'
import { getVenue } from '../api/venues'
import { formatMoney, hhmm, hourLabel, phoneLink } from '../utils/format'
import { getBookingsByVenueAndDate } from '../api/bookings'
import { useAuthStore } from '../store/authStore'
import DateStrip from '../components/DateStrip'
import { Card, EmptyState, MoneyLine, PaymentBadge, Skeleton } from '../components/ui'
import { buttonClass, paymentDotClass } from '../components/styles'
import type { Booking, PaymentStatus } from '../types'

const slotTone: Record<PaymentStatus, string> = {
  FullyPaid: 'bg-paid-soft',
  Prepaid: 'bg-pre-soft',
  Unpaid: 'bg-due-soft',
}

function BookedSlot({ booking }: { booking: Booking }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <div className={`rounded-xl ${slotTone[booking.paymentStatus]}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-12 w-full items-center gap-3 px-3.5 py-2 text-left"
      >
        <span className={`size-2 shrink-0 rounded-full ${paymentDotClass(booking.paymentStatus)}`} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-ink">{booking.clientName}</span>
          <span className="block truncate text-xs text-ink-2 tabular">{booking.clientPhone}</span>
        </span>
        <span className="hidden sm:block">
          <PaymentBadge status={booking.paymentStatus} className="bg-surface/70" />
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-ink-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="space-y-3 border-t border-ink/5 px-3.5 pt-3 pb-3.5">
          <span className="block sm:hidden">
            <PaymentBadge status={booking.paymentStatus} className="bg-surface/70" />
          </span>
          <MoneyLine booking={booking} />
          {booking.notes && <p className="text-sm text-ink-2">{booking.notes}</p>}
          <a href={phoneLink(booking.clientPhone)} className={buttonClass('secondary', 'sm', 'w-full sm:w-auto')}>
            <Phone className="size-4" />
            {t('bookings.callClient')}
          </a>
        </div>
      )}
    </div>
  )
}

export default function VenueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const loggedIn = useAuthStore((s) => s.isAuthenticated())
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [now] = useState(() => Date.now())

  const { data: venue, isLoading: venueLoading } = useQuery({
    queryKey: ['venue', id],
    queryFn: () => getVenue(id!),
  })

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings', id, selectedDate],
    queryFn: () => getBookingsByVenueAndDate(id!, selectedDate),
    enabled: !!id,
  })

  if (venueLoading)
    return (
      <div className="grid gap-5 lg:grid-cols-[minmax(0,360px)_1fr]" role="status" aria-label={t('common.loading')}>
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-[480px] rounded-2xl" />
      </div>
    )
  if (!venue)
    return (
      <EmptyState
        icon={<SearchX className="size-6" />}
        title={t('venues.notFound')}
        action={<Link to="/venues" className={buttonClass('secondary')}>{t('common.back')}</Link>}
      />
    )

  const openHour = parseInt(venue.openTime.substring(0, 2))
  const closeHour = parseInt(venue.closeTime.substring(0, 2))
  const hours = Array.from({ length: closeHour - openHour }, (_, i) => openHour + i)

  // A slot is in the past if its start (selectedDate + hour) is before now.
  const isPastHour = (hour: number) => {
    const slot = new Date(`${selectedDate}T${String(hour).padStart(2, '0')}:00:00`)
    return slot.getTime() < now
  }

  const bookingByHour = new Map<number, Booking>()
  bookings.forEach((b) => {
    if (b.status === 'Active') {
      const h = parseInt(b.startTime.substring(0, 2))
      bookingByHour.set(h, b)
    }
  })

  const freeCount = hours.filter((h) => !bookingByHour.has(h) && !isPastHour(h)).length

  return (
    <div className={loggedIn ? '' : 'pb-20 lg:pb-0'}>
      <Link
        to="/venues"
        className="-ml-2 mb-3 inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        {t('nav.venues')}
      </Link>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-7">
        <Card className="overflow-hidden lg:sticky lg:top-9">
          <div className="aspect-[16/9] bg-sunken">
            <img
              src={venue.imageUrl || '/venue-placeholder.svg'}
              onError={(e) => { e.currentTarget.src = '/venue-placeholder.svg' }}
              alt={venue.name}
              className="size-full object-cover"
            />
          </div>
          <div className="p-4 lg:p-5">
            <h1 className="text-[22px] font-bold leading-tight tracking-[-0.02em] text-ink">{venue.name}</h1>
            <div className="mt-1.5 flex items-start gap-1.5 text-sm text-ink-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-ink-3" />
              {venue.address}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-sunken px-3 py-2.5">
                <div className="text-xs text-ink-3">{t('venues.price')}</div>
                <div className="mt-0.5 font-bold text-ink tabular">
                  {formatMoney(venue.pricePerHour)}{' '}
                  <span className="text-sm font-medium text-ink-3">{t('venues.pricePerHour')}</span>
                </div>
              </div>
              <div className="rounded-xl bg-sunken px-3 py-2.5">
                <div className="text-xs text-ink-3">{t('venues.workingHours')}</div>
                <div className="mt-0.5 flex items-center gap-1.5 font-bold text-ink tabular">
                  <Clock className="size-3.5 text-ink-3" />
                  {hhmm(venue.openTime)}–{hhmm(venue.closeTime)}
                </div>
              </div>
            </div>
            {venue.description && <p className="mt-4 text-sm leading-relaxed text-ink-2">{venue.description}</p>}
            <a
              href={phoneLink(venue.phone)}
              className={buttonClass(loggedIn ? 'secondary' : 'primary', 'md', 'mt-4 w-full')}
            >
              <Phone className="size-4" />
              <span className="tabular">{venue.phone}</span>
            </a>
          </div>
        </Card>

        <Card className="p-4 lg:p-5">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-bold tracking-[-0.01em] text-ink">
              {loggedIn ? t('schedule.title') : t('schedule.availabilityToday')}
            </h2>
            <span className="text-sm text-ink-3">
              {t('schedule.freeOf', { free: freeCount, total: hours.length })}
            </span>
          </div>

          {/* Only logged-in users pick a date; guests see today's availability. */}
          {loggedIn && (
            <div className="mb-4">
              <DateStrip value={selectedDate} onChange={setSelectedDate} />
            </div>
          )}

          {/* Legend — guests only need busy vs free; staff see payment statuses. */}
          {loggedIn && (
            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-ink-3">
              {(['FullyPaid', 'Prepaid', 'Unpaid'] as PaymentStatus[]).map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${paymentDotClass(s)}`} />
                  {t(`bookings.paymentStatuses.${s.toLowerCase()}`)}
                </span>
              ))}
            </div>
          )}

          {bookingsLoading ? (
            <div className="space-y-1.5" role="status" aria-label={t('common.loading')}>
              {hours.slice(0, 8).map((h) => (
                <Skeleton key={h} className="h-12" />
              ))}
            </div>
          ) : (
            <ol className="divide-y divide-line">
              {hours.map((hour) => {
                const booking = bookingByHour.get(hour)
                const past = isPastHour(hour)
                return (
                  <li key={hour} className="flex items-start gap-3 py-1.5">
                    <div className={`w-14 shrink-0 pt-3 tabular ${past && !booking ? 'opacity-50' : ''}`}>
                      <div className="text-[15px] font-bold leading-none text-ink">{hourLabel(hour)}</div>
                      <div className="mt-1 text-[11px] leading-none text-ink-3">{hourLabel(hour + 1)}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      {booking ? (
                        loggedIn ? (
                          <BookedSlot booking={booking} />
                        ) : (
                          // Guests just see the slot is taken — no client details.
                          <div className="flex min-h-12 items-center rounded-xl bg-sunken px-3.5 text-sm font-semibold text-ink-3">
                            {t('bookings.booked')}
                          </div>
                        )
                      ) : past ? (
                        // Past slots can't be booked.
                        <div className="flex min-h-12 items-center px-3.5 text-sm text-ink-3/70">
                          {t('bookings.past')}
                        </div>
                      ) : loggedIn ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/bookings/new?venueId=${id}&date=${selectedDate}&hour=${hour}`)}
                          className="group flex min-h-12 w-full items-center justify-between rounded-xl border border-dashed border-line-strong px-3.5 text-left transition-colors duration-150 hover:border-brand hover:bg-brand-soft"
                        >
                          <span className="text-sm font-medium text-ink-2">{t('bookings.free')}</span>
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
                            <Plus className="size-4" />
                            {t('bookings.book')}
                          </span>
                        </button>
                      ) : (
                        // Guests can't book online — direct them to call the venue.
                        <div className="flex min-h-12 items-center rounded-xl border border-dashed border-brand/40 bg-brand-soft/60 px-3.5 text-sm font-semibold text-brand-ink">
                          {t('bookings.free')}
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </Card>
      </div>

      {!loggedIn && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden">
          <a href={phoneLink(venue.phone)} className={buttonClass('primary', 'lg', 'w-full')}>
            <Phone className="size-4" />
            {t('bookings.callToBookShort')}
          </a>
        </div>
      )}
    </div>
  )
}
