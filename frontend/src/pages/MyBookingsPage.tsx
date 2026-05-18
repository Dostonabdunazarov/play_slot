import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Calendar, Clock, MapPin } from 'lucide-react'
import { formatDate, phoneLink } from '../utils/format'
import { getMyBookings, cancelBooking } from '../api/bookings'
import type { PaymentStatus, BookingStatus } from '../types'

function PaymentBadge({ status }: { status: PaymentStatus }) {
  const { t } = useTranslation()
  const map: Record<PaymentStatus, string> = {
    FullyPaid: 'bg-green-100 text-green-800',
    Prepaid: 'bg-yellow-100 text-yellow-800',
    Unpaid: 'bg-gray-100 text-gray-700',
  }
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status]}`}>
      {t(`bookings.paymentStatuses.${status.toLowerCase()}`)}
    </span>
  )
}

function StatusBadge({ status }: { status: BookingStatus }) {
  const { t } = useTranslation()
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        status === 'Active' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-700'
      }`}
    >
      {t(`bookings.statuses.${status.toLowerCase()}`)}
    </span>
  )
}

export default function MyBookingsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['myBookings'],
    queryFn: getMyBookings,
  })

  const cancelMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myBookings'] })
      toast.success(t('bookings.cancelBooking'))
    },
    onError: () => toast.error(t('common.error')),
  })

  if (isLoading) return <div className="text-center py-20 text-gray-500">{t('common.loading')}</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('bookings.myBookings')}</h1>

      {!bookings.length ? (
        <div className="text-center py-20 text-gray-500">{t('bookings.noBookings')}</div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="font-semibold text-gray-900 mb-1">{booking.venueName}</div>
                  <div className="flex gap-2 flex-wrap">
                    <StatusBadge status={booking.status} />
                    <PaymentBadge status={booking.paymentStatus} />
                  </div>
                </div>
                {booking.status === 'Active' && (
                  <button
                    onClick={() => {
                      if (confirm(t('bookings.cancelConfirm'))) cancelMutation.mutate(booking.id)
                    }}
                    disabled={cancelMutation.isPending}
                    className="text-xs text-red-600 hover:text-red-800 border border-red-200 hover:border-red-400 px-3 py-1 rounded-lg transition-colors flex-shrink-0"
                  >
                    {t('bookings.cancelBooking')}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-violet-500 flex-shrink-0" />
                  <span>{formatDate(booking.date)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <span>{booking.startTime.substring(0, 5)} — {booking.endTime.substring(0, 5)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <a href={phoneLink(booking.clientPhone)} className="truncate text-green-700 hover:underline">{booking.clientPhone}</a>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-xs">
                <span className="text-gray-500">Итого: <span className="font-medium text-gray-800">{booking.totalAmount.toLocaleString()} сум</span></span>
                <span className="text-green-700">Оплачено: <span className="font-medium">{(booking.paymentStatus === 'FullyPaid' ? booking.totalAmount : booking.prepaymentAmount ?? 0).toLocaleString()} сум</span></span>
                <span className="text-red-600">Остаток: <span className="font-medium">{(booking.paymentStatus === 'FullyPaid' ? 0 : booking.totalAmount - (booking.prepaymentAmount ?? 0)).toLocaleString()} сум</span></span>
              </div>

              {booking.notes && (
                <p className="mt-3 text-xs text-gray-500 italic">"{booking.notes}"</p>
              )}

              <div className="mt-2 text-xs text-gray-400">
                {format(new Date(booking.createdAt), 'dd.MM.yyyy HH:mm')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
