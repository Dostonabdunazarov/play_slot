import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import { getVenue } from '../api/venues'
import { createBooking } from '../api/bookings'
import { useAuthStore } from '../store/authStore'

export default function NewBookingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)

  const venueId = searchParams.get('venueId') ?? ''
  const date = searchParams.get('date') ?? ''
  const hour = parseInt(searchParams.get('hour') ?? '9')

  const startTime = `${String(hour).padStart(2, '0')}:00:00`
  const endTime = `${String(hour + 1).padStart(2, '0')}:00:00`

  const [clientName, setClientName] = useState(user?.fullName ?? '')
  const [clientPhone, setClientPhone] = useState(user?.phone ?? '')
  const [notes, setNotes] = useState('')

  const { data: venue } = useQuery({
    queryKey: ['venue', venueId],
    queryFn: () => getVenue(venueId),
    enabled: !!venueId,
  })

  const mutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['myBookings'] })
      toast.success(t('bookings.newBooking') + ' — OK')
      navigate(`/venues/${venueId}`)
    },
    onError: () => {
      toast.error(t('common.error'))
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate({ venueId, clientName, clientPhone, date, startTime, notes: notes || undefined })
  }

  return (
    <div className="max-w-lg">
      <Link
        to={`/venues/${venueId}`}
        className="inline-flex items-center gap-1 text-sm text-green-700 hover:text-green-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4 text-green-700" />
        {t('common.back')}
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('bookings.newBooking')}</h1>

      {/* Booking summary */}
      {venue && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 space-y-2">
          <div className="font-semibold text-green-900">{venue.name}</div>
          <div className="text-sm text-green-700 flex flex-wrap gap-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-violet-500" />
              {date}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-orange-500" />
              {startTime.substring(0, 5)} — {endTime.substring(0, 5)}
            </span>
            <span className="flex items-center gap-1.5">
              {venue.pricePerHour.toLocaleString()} сум / {t('venues.pricePerHour')}
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('bookings.clientName')} *
          </label>
          <input
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('bookings.clientPhone')} *
          </label>
          <input
            required
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('bookings.notes')}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {mutation.isPending ? t('common.loading') : t('bookings.bookSlot')}
          </button>
          <Link
            to={`/venues/${venueId}`}
            className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('common.cancel')}
          </Link>
        </div>
      </form>
    </div>
  )
}
