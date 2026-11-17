import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { ArrowLeft, CalendarDays, Clock, Wallet } from 'lucide-react'
import { getVenue } from '../api/venues'
import { createBooking } from '../api/bookings'
import { useAuthStore } from '../store/authStore'
import { formatDate, formatMoney } from '../utils/format'
import { Button, Card, Field, PageHeader, Skeleton, inputClass, textareaClass } from '../components/ui'
import { buttonClass } from '../components/styles'

export default function NewBookingPage() {
  const { t, i18n } = useTranslation()
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

  const { data: venue, isLoading } = useQuery({
    queryKey: ['venue', venueId],
    queryFn: () => getVenue(venueId),
    enabled: !!venueId,
  })

  const mutation = useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      queryClient.invalidateQueries({ queryKey: ['myBookings'] })
      toast.success(t('bookings.created'))
      navigate(`/venues/${venueId}`)
    },
    onError: () => {
      toast.error(t('bookings.createError'))
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate({ venueId, clientName, clientPhone, date, startTime, notes: notes || undefined })
  }

  const back = `/venues/${venueId}`

  return (
    <div className="mx-auto max-w-lg">
      <Link
        to={back}
        className="-ml-2 mb-3 inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        {t('common.back')}
      </Link>

      <PageHeader title={t('bookings.newBooking')} />

      {isLoading ? (
        <Skeleton className="mb-4 h-28 rounded-2xl" />
      ) : venue ? (
        <Card className="mb-4 p-4">
          <div className="text-base font-bold text-ink">{venue.name}</div>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-xl bg-sunken px-3 py-2">
              <dt className="flex items-center gap-1 text-xs text-ink-3">
                <CalendarDays className="size-3.5" />
                {t('bookings.date')}
              </dt>
              <dd className="mt-0.5 font-semibold text-ink">{date ? formatDate(date, i18n.language).replace(/ \d{4}$/, '') : '—'}</dd>
            </div>
            <div className="rounded-xl bg-sunken px-3 py-2">
              <dt className="flex items-center gap-1 text-xs text-ink-3">
                <Clock className="size-3.5" />
                {t('bookings.time')}
              </dt>
              <dd className="mt-0.5 font-semibold text-ink tabular">
                {startTime.substring(0, 5)}–{endTime.substring(0, 5)}
              </dd>
            </div>
            <div className="rounded-xl bg-sunken px-3 py-2">
              <dt className="flex items-center gap-1 text-xs text-ink-3">
                <Wallet className="size-3.5" />
                {t('bookings.price')}
              </dt>
              <dd className="mt-0.5 font-semibold text-ink tabular">{formatMoney(venue.pricePerHour)}</dd>
            </div>
          </dl>
        </Card>
      ) : null}

      <Card className="p-4 sm:p-5">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label={t('bookings.clientName')} htmlFor="clientName" required>
            <input
              id="clientName"
              required
              autoComplete="off"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label={t('bookings.clientPhone')} htmlFor="clientPhone" required>
            <input
              id="clientPhone"
              required
              type="tel"
              inputMode="tel"
              autoComplete="off"
              placeholder="+998 90 123 45 67"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className={`${inputClass} tabular`}
            />
          </Field>

          <Field label={t('bookings.notes')} htmlFor="notes">
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={textareaClass}
            />
          </Field>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row">
            <Link to={back} className={buttonClass('secondary', 'lg', 'sm:w-auto')}>
              {t('common.cancel')}
            </Link>
            <Button type="submit" size="lg" loading={mutation.isPending} className="sm:flex-1">
              {t('bookings.bookSlot')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
