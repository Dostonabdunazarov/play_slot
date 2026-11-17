import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { ClipboardList, Phone, UserRound, X } from 'lucide-react'
import { getAllBookings, cancelBooking, updatePayment } from '../../api/bookings'
import { formatDate, hhmm, phoneLink } from '../../utils/format'
import { getVenues } from '../../api/venues'
import {
  Button,
  Card,
  EmptyState,
  ListSkeleton,
  MoneyLine,
  PageHeader,
  PaymentBadge,
  Tag,
  inputClass,
} from '../../components/ui'
import PaymentModal from '../../components/PaymentModal'
import type { Booking, PaymentStatus } from '../../types'
import { DateField } from '../../components/DatePicker'

export default function AdminBookingsPage() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [filterVenue, setFilterVenue] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [paymentModal, setPaymentModal] = useState<Booking | null>(null)
  const [now] = useState(() => Date.now())

  const { data: bookings = [], isLoading } = useQuery({ queryKey: ['allBookings'], queryFn: getAllBookings })
  const { data: venues = [] } = useQuery({ queryKey: ['venues'], queryFn: getVenues })

  const cancelMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['allBookings'] }); toast.success(t('bookings.cancelled')) },
    onError: () => toast.error(t('common.error')),
  })

  const paymentMutation = useMutation({
    mutationFn: ({ id, status, prepayment }: { id: string; status: PaymentStatus; prepayment?: number }) =>
      updatePayment(id, { paymentStatus: status, prepaymentAmount: prepayment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBookings'] })
      setPaymentModal(null)
      toast.success(t('bookings.paymentSaved'))
    },
    onError: () => toast.error(t('common.error')),
  })

  const filtered = bookings
    .filter((b) => {
      if (filterVenue && b.venueId !== filterVenue) return false
      if (filterDate && b.date !== filterDate) return false
      return true
    })
    // Sort by booking date + start time, newest first.
    .sort(
      (a, b) =>
        new Date(`${b.date}T${b.startTime}`).getTime() -
        new Date(`${a.date}T${a.startTime}`).getTime()
    )

  // A booking is past once its end time (date + endTime) is before now.
  const isPast = (b: Booking) => new Date(`${b.date}T${b.endTime}`).getTime() < now

  const groups: { date: string; items: Booking[] }[] = []
  filtered.forEach((b) => {
    const last = groups[groups.length - 1]
    if (last && last.date === b.date) last.items.push(b)
    else groups.push({ date: b.date, items: [b] })
  })

  const hasFilter = !!(filterVenue || filterDate)

  return (
    <div>
      <PageHeader
        title={t('nav.adminBookings')}
        description={!isLoading ? t('bookings.count', { count: filtered.length }) : undefined}
      />

      <div className="mb-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <select
          value={filterVenue}
          onChange={(e) => setFilterVenue(e.target.value)}
          aria-label={t('bookings.venue')}
          className={`${inputClass} sm:w-56`}
        >
          <option value="">{t('schedule.allVenues')}</option>
          {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <DateField
          value={filterDate}
          onChange={setFilterDate}
          label={t('bookings.date')}
          placeholder={t('bookings.anyDate')}
          className="sm:w-52"
        />
        {hasFilter && (
          <Button
            variant="ghost"
            size="sm"
            icon={<X className="size-4" />}
            onClick={() => { setFilterVenue(''); setFilterDate('') }}
            className="col-span-2 justify-self-start"
          >
            {t('common.reset')}
          </Button>
        )}
      </div>

      {isLoading ? (
        <ListSkeleton rows={4} className="h-36 rounded-2xl" />
      ) : !filtered.length ? (
        <Card>
          <EmptyState
            icon={<ClipboardList className="size-6" />}
            title={t('bookings.noBookings')}
            text={hasFilter ? t('bookings.noBookingsFiltered') : undefined}
            action={
              hasFilter ? (
                <Button variant="secondary" onClick={() => { setFilterVenue(''); setFilterDate('') }}>
                  {t('common.reset')}
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.date}>
              <h2 className="mb-2 px-1 text-sm font-semibold text-ink-3">{formatDate(g.date, i18n.language)}</h2>
              <div className="space-y-2.5">
                {g.items.map((booking) => {
                  const past = booking.status === 'Active' && isPast(booking)
                  const cancelled = booking.status === 'Cancelled'
                  return (
                    <Card key={booking.id} className={`p-4 ${cancelled ? 'opacity-60' : ''}`}>
                      <div className="flex items-start gap-3">
                        <div className="w-[3.25rem] shrink-0 tabular">
                          <div className="text-[0.9375rem] font-bold leading-tight text-ink">{hhmm(booking.startTime)}</div>
                          <div className="text-xs text-ink-3">{hhmm(booking.endTime)}</div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                            <span className="font-semibold text-ink">{booking.clientName}</span>
                            {cancelled ? (
                              <Tag tone="danger">{t('bookings.statuses.cancelled')}</Tag>
                            ) : (
                              <PaymentBadge status={booking.paymentStatus} />
                            )}
                            {past && <Tag>{t('bookings.past')}</Tag>}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-3">
                            <span className="font-medium text-ink-2">{booking.venueName}</span>
                            <a
                              href={phoneLink(booking.clientPhone)}
                              className="inline-flex items-center gap-1 text-accent tabular hover:underline"
                            >
                              <Phone className="size-3.5" />
                              {booking.clientPhone}
                            </a>
                            {booking.createdByName && (
                              <span className="inline-flex items-center gap-1" title={t('bookings.createdBy')}>
                                <UserRound className="size-3.5" />
                                {booking.createdByName}
                              </span>
                            )}
                          </div>
                          {booking.notes && <p className="mt-1.5 text-sm text-ink-2">{booking.notes}</p>}
                          <MoneyLine booking={booking} className="mt-3 max-w-sm" />
                        </div>
                      </div>

                      {booking.status === 'Active' && (
                        <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3 sm:justify-end">
                          {/* Payment stays editable even for past bookings (paid later). */}
                          <Button variant="secondary" size="sm" className="flex-1 sm:flex-none" onClick={() => setPaymentModal(booking)}>
                            {t('bookings.updatePayment')}
                          </Button>
                          {/* Cancelling a slot that already passed makes no sense. */}
                          {!past && (
                            <Button
                              variant="danger"
                              size="sm"
                              className="flex-1 sm:flex-none"
                              disabled={cancelMutation.isPending}
                              onClick={() => { if (confirm(t('bookings.cancelConfirm'))) cancelMutation.mutate(booking.id) }}
                            >
                              {t('bookings.cancelBooking')}
                            </Button>
                          )}
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {paymentModal && (
        <PaymentModal
          booking={paymentModal}
          onClose={() => setPaymentModal(null)}
          onSave={(status, prepayment) => paymentMutation.mutate({ id: paymentModal.id, status, prepayment })}
          loading={paymentMutation.isPending}
        />
      )}
    </div>
  )
}
