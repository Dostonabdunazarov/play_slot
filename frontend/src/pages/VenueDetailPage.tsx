import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { ArrowLeft, MapPin, Phone, Clock, Calendar } from 'lucide-react'
import { getVenue } from '../api/venues'
import { phoneLink, todayIso } from '../utils/format'
import { getBookingsByVenueAndDate } from '../api/bookings'
import { useAuthStore } from '../store/authStore'
import type { Booking } from '../types'

function formatTime(t: string) {
  return t.substring(0, 5)
}

function paymentBadgeClass(status: string) {
  if (status === 'FullyPaid') return 'bg-green-500'
  if (status === 'Prepaid') return 'bg-yellow-400'
  return 'bg-gray-400'
}

function SlotTooltip({ booking }: { booking: Booking }) {
  const { t } = useTranslation()
  return (
    <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl pointer-events-none">
      <div className="font-semibold mb-1">{booking.clientName}</div>
      <a href={phoneLink(booking.clientPhone)} className="text-green-400 hover:underline">{booking.clientPhone}</a>
      <div className="mt-1 text-gray-300">
        {t(`bookings.paymentStatuses.${booking.paymentStatus.toLowerCase()}`)}
      </div>
      {booking.notes && <div className="mt-1 text-gray-400 italic">{booking.notes}</div>}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
    </div>
  )
}

export default function VenueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const loggedIn = useAuthStore((s) => s.isAuthenticated())
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [hoveredBooking, setHoveredBooking] = useState<string | null>(null)

  const { data: venue, isLoading: venueLoading } = useQuery({
    queryKey: ['venue', id],
    queryFn: () => getVenue(id!),
  })

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings', id, selectedDate],
    queryFn: () => getBookingsByVenueAndDate(id!, selectedDate),
    enabled: !!id,
  })

  if (venueLoading) return <div className="text-center py-20 text-gray-500">{t('common.loading')}</div>
  if (!venue) return null

  const openHour = parseInt(venue.openTime.substring(0, 2))
  const closeHour = parseInt(venue.closeTime.substring(0, 2))
  const hours = Array.from({ length: closeHour - openHour }, (_, i) => openHour + i)

  // A slot is in the past if its start (selectedDate + hour) is before now.
  const isPastHour = (hour: number) => {
    const slot = new Date(`${selectedDate}T${String(hour).padStart(2, '0')}:00:00`)
    return slot.getTime() < Date.now()
  }

  const bookingByHour = new Map<number, Booking>()
  bookings.forEach((b) => {
    if (b.status === 'Active') {
      const h = parseInt(b.startTime.substring(0, 2))
      bookingByHour.set(h, b)
    }
  })

  return (
    <div className="max-w-4xl">
      <Link to="/venues" className="inline-flex items-center gap-1 text-sm text-green-700 hover:text-green-900 mb-4">
        <ArrowLeft className="w-4 h-4 text-green-700" />
        {t('common.back')}
      </Link>

      {/* Venue header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="h-56 bg-gray-200 overflow-hidden">
          <img
            src={venue.imageUrl || '/venue-placeholder.svg'}
            onError={(e) => { e.currentTarget.src = '/venue-placeholder.svg' }}
            alt={venue.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-5">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">{venue.name}</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span>{venue.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-green-500 flex-shrink-0" />
              <a href={phoneLink(venue.phone)} className="text-green-700 hover:underline">{venue.phone}</a>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <span>{formatTime(venue.openTime)} — {formatTime(venue.closeTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-green-700">{venue.pricePerHour.toLocaleString()} сум / {t('venues.pricePerHour')}</span>
            </div>
          </div>
          {venue.description && <p className="text-gray-600 text-sm">{venue.description}</p>}
        </div>
      </div>

      {/* Schedule */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-violet-500" />
            {loggedIn ? t('schedule.title') : t('schedule.availabilityToday')}
          </h2>
          {/* Only logged-in users pick a date; guests see today's availability. */}
          {loggedIn && (
            <input
              type="date"
              value={selectedDate}
              min={todayIso()}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          )}
        </div>

        {/* Legend — guests only need busy vs free; staff see payment statuses. */}
        <div className="flex gap-4 mb-4 text-xs text-gray-500">
          {loggedIn ? (
            <>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500 inline-block" />{t('bookings.paymentStatuses.fullypaid')}</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-400 inline-block" />{t('bookings.paymentStatuses.prepaid')}</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-400 inline-block" />{t('bookings.paymentStatuses.unpaid')}</div>
            </>
          ) : (
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-400 inline-block" />{t('bookings.booked')}</div>
          )}
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-100 border border-gray-200 inline-block" />{t('bookings.free')}</div>
        </div>

        {/* Timeline */}
        <div className="grid gap-2">
          {hours.map((hour) => {
            const booking = bookingByHour.get(hour)
            const timeLabel = `${String(hour).padStart(2, '0')}:00`
            const nextLabel = `${String(hour + 1).padStart(2, '0')}:00`

            return (
              <div key={hour} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-12 flex-shrink-0 text-right">
                  {timeLabel}–{nextLabel}
                </span>
                <div className="flex-1 relative">
                  {booking ? (
                    loggedIn ? (
                      <div
                        className={`relative h-10 rounded-lg ${paymentBadgeClass(booking.paymentStatus)} flex items-center px-3 cursor-default`}
                        onMouseEnter={() => setHoveredBooking(booking.id)}
                        onMouseLeave={() => setHoveredBooking(null)}
                      >
                        <span className="text-white text-xs font-medium truncate">
                          {booking.clientName} · <a href={phoneLink(booking.clientPhone)} className="hover:underline">{booking.clientPhone}</a>
                        </span>
                        {hoveredBooking === booking.id && <SlotTooltip booking={booking} />}
                      </div>
                    ) : (
                      // Guests just see the slot is taken — no client details.
                      <div className="h-10 rounded-lg bg-gray-400 flex items-center px-3 cursor-default">
                        <span className="text-white text-xs font-medium">{t('bookings.booked')}</span>
                      </div>
                    )
                  ) : isPastHour(hour) ? (
                    // Past slots can't be booked.
                    <div className="w-full h-10 rounded-lg bg-gray-50 border border-dashed border-gray-100 flex items-center px-3 text-xs text-gray-300">
                      {t('bookings.past')}
                    </div>
                  ) : loggedIn ? (
                    <button
                      onClick={() =>
                        navigate(
                          `/bookings/new?venueId=${id}&date=${selectedDate}&hour=${hour}`
                        )
                      }
                      className="w-full h-10 rounded-lg bg-gray-50 border border-dashed border-gray-200 hover:bg-green-50 hover:border-green-300 transition-colors text-xs text-gray-400 hover:text-green-600"
                    >
                      {t('bookings.free')} — {t('bookings.bookSlot')}
                    </button>
                  ) : (
                    // Guests can't book online — direct them to call the venue.
                    <div className="w-full h-10 rounded-lg bg-gray-50 border border-dashed border-gray-200 flex items-center px-3 text-xs text-gray-400">
                      {t('bookings.free')} — {t('bookings.callToBook')}{' '}
                      <a href={phoneLink(venue.phone)} className="ml-1 text-green-600 hover:underline font-medium">
                        {venue.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
