import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Phone, Ticket } from 'lucide-react'
import { formatDate, hhmm, phoneLink } from '../utils/format'
import { getMyBookings, cancelBooking, updatePayment } from '../api/bookings'
import PaymentModal from '../components/PaymentModal'
import type { Booking, PaymentStatus } from '../types'
import { Button, Card, EmptyState, ListSkeleton, MoneyLine, PageHeader, PaymentBadge, Tag } from '../components/ui'
import { buttonClass } from '../components/styles'

export default function MyBookingsPage() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['myBookings'],
    queryFn: getMyBookings,
  })

  const [paymentModal, setPaymentModal] = useState<Booking | null>(null)

  const paymentMutation = useMutation({
    mutationFn: ({ id, status, prepayment }: { id: string; status: PaymentStatus; prepayment?: number }) =>
      updatePayment(id, { paymentStatus: status, prepaymentAmount: prepayment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] })
      setPaymentModal(null)
      toast.success(t('bookings.paymentSaved'))
    },
    onError: () => toast.error(t('common.error')),
  })

  const cancelMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] })
      toast.success(t('bookings.cancelled'))
    },
    onError: () => toast.error(t('common.error')),
  })

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={t('bookings.myBookings')}
        description={bookings.length ? t('bookings.count', { count: bookings.length }) : undefined}
      />

      {isLoading ? (
        <ListSkeleton rows={4} className="h-40 rounded-2xl" />
      ) : !bookings.length ? (
        <EmptyState
          icon={<Ticket className="size-6" />}
          title={t('bookings.noBookings')}
          text={t('bookings.noBookingsHint')}
          action={<Link to="/venues" className={buttonClass('primary')}>{t('nav.venues')}</Link>}
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const cancelled = booking.status === 'Cancelled'
            return (
              <Card key={booking.id} className={`p-4 ${cancelled ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-ink-3">{booking.venueName}</div>
                    <div className="mt-0.5 text-base font-bold text-ink">
                      {formatDate(booking.date, i18n.language)}
                      <span className="ml-2 font-semibold text-ink-2 tabular">
                        {hhmm(booking.startTime)}–{hhmm(booking.endTime)}
                      </span>
                    </div>
                  </div>
                  {cancelled ? (
                    <Tag tone="danger">{t('bookings.statuses.cancelled')}</Tag>
                  ) : (
                    <PaymentBadge status={booking.paymentStatus} />
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2 text-sm text-ink-2">
                  <span className="font-semibold text-ink">{booking.clientName}</span>
                  <a href={phoneLink(booking.clientPhone)} className="text-brand tabular hover:underline">
                    {booking.clientPhone}
                  </a>
                </div>

                {booking.notes && <p className="mt-2 text-sm text-ink-2">{booking.notes}</p>}

                <MoneyLine booking={booking} className="mt-3 rounded-xl bg-sunken px-3 py-2.5" />

                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-xs text-ink-3 tabular">
                    {t('bookings.createdAt')} {format(new Date(booking.createdAt), 'dd.MM.yyyy HH:mm')}
                  </span>
                  <div className="flex gap-2">
                    <a
                      href={phoneLink(booking.clientPhone)}
                      aria-label={t('bookings.callClient')}
                      className={buttonClass('secondary', 'sm', 'sm:hidden')}
                    >
                      <Phone className="size-4" />
                    </a>
                    {booking.status === 'Active' && (
                      <Button variant="secondary" size="sm" onClick={() => setPaymentModal(booking)}>
                        {t('bookings.updatePayment')}
                      </Button>
                    )}
                    {booking.status === 'Active' && (
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={cancelMutation.isPending}
                        onClick={() => {
                          if (confirm(t('bookings.cancelConfirm'))) cancelMutation.mutate(booking.id)
                        }}
                      >
                        {t('bookings.cancelBooking')}
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
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
