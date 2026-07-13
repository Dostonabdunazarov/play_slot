import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Calendar, Clock, Phone, X, UserCircle } from 'lucide-react'
import { getAllBookings, cancelBooking, updatePayment } from '../../api/bookings'
import { formatDate, phoneLink } from '../../utils/format'
import { getVenues } from '../../api/venues'
import type { Booking, PaymentStatus } from '../../types'

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

function PaymentModal({
  booking,
  onClose,
  onSave,
  loading,
}: {
  booking: Booking
  onClose: () => void
  onSave: (status: PaymentStatus, prepayment?: number) => void
  loading: boolean
}) {
  const { t } = useTranslation()
  const [status, setStatus] = useState<PaymentStatus>(booking.paymentStatus)
  const [prepayment, setPrepayment] = useState<string>(booking.prepaymentAmount?.toString() ?? '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold">{t('bookings.updatePayment')}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{booking.clientName}</span> · {formatDate(booking.date)} · {booking.startTime.substring(0, 5)}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('bookings.paymentStatus')}</label>
            <div className="space-y-2">
              {(['Unpaid', 'Prepaid', 'FullyPaid'] as PaymentStatus[]).map((s) => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentStatus"
                    value={s}
                    checked={status === s}
                    onChange={() => setStatus(s)}
                    className="accent-green-600"
                  />
                  <span className="text-sm">{t(`bookings.paymentStatuses.${s.toLowerCase()}`)}</span>
                </label>
              ))}
            </div>
          </div>

          {status === 'Prepaid' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('bookings.prepayment')}</label>
              <input
                type="number"
                min={0}
                value={prepayment}
                onChange={(e) => setPrepayment(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => onSave(status, prepayment ? parseFloat(prepayment) : undefined)}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-medium py-2 rounded-lg transition-colors text-sm"
            >
              {loading ? t('common.loading') : t('common.save')}
            </button>
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminBookingsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [filterVenue, setFilterVenue] = useState('')
  const [filterDate, setFilterDate] = useState('')
  const [paymentModal, setPaymentModal] = useState<Booking | null>(null)

  const { data: bookings = [], isLoading } = useQuery({ queryKey: ['allBookings'], queryFn: getAllBookings })
  const { data: venues = [] } = useQuery({ queryKey: ['venues'], queryFn: getVenues })

  const cancelMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['allBookings'] }); toast.success(t('bookings.cancelBooking')) },
    onError: () => toast.error(t('common.error')),
  })

  const paymentMutation = useMutation({
    mutationFn: ({ id, status, prepayment }: { id: string; status: PaymentStatus; prepayment?: number }) =>
      updatePayment(id, { paymentStatus: status, prepaymentAmount: prepayment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allBookings'] })
      setPaymentModal(null)
      toast.success(t('common.save'))
    },
    onError: () => toast.error(t('common.error')),
  })

  const filtered = bookings.filter((b) => {
    if (filterVenue && b.venueId !== filterVenue) return false
    if (filterDate && b.date !== filterDate) return false
    return true
  })

  if (isLoading) return <div className="text-center py-20 text-gray-500">{t('common.loading')}</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('nav.adminBookings')}</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={filterVenue}
          onChange={(e) => setFilterVenue(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">{t('schedule.allVenues')}</option>
          {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        {(filterVenue || filterDate) && (
          <button
            onClick={() => { setFilterVenue(''); setFilterDate('') }}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> {t('common.reset')}
          </button>
        )}
      </div>

      {!filtered.length ? (
        <div className="text-center py-20 text-gray-500">{t('bookings.noBookings')}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => (
            <div
              key={booking.id}
              className={`bg-white rounded-xl shadow-sm border p-4 ${
                booking.status === 'Cancelled' ? 'border-gray-100 opacity-60' : 'border-gray-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">{booking.clientName}</span>
                    <PaymentBadge status={booking.paymentStatus} />
                    {booking.status === 'Cancelled' && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                        {t('bookings.statuses.cancelled')}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    <span className="text-green-700 font-medium">{booking.venueName}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-violet-500" />{formatDate(booking.date)}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-orange-500" />{booking.startTime.substring(0, 5)}–{booking.endTime.substring(0, 5)}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-green-500" /><a href={phoneLink(booking.clientPhone)} className="text-green-700 hover:underline">{booking.clientPhone}</a></span>
                    {booking.createdByName && (
                      <span className="flex items-center gap-1" title={t('bookings.createdBy')}>
                        <UserCircle className="w-3.5 h-3.5 text-blue-500" />{booking.createdByName}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs">
                    <span className="text-gray-500">Итого: <span className="font-medium text-gray-800">{booking.totalAmount.toLocaleString()} сум</span></span>
                    <span className="text-green-700">Оплачено: <span className="font-medium">{(booking.paymentStatus === 'FullyPaid' ? booking.totalAmount : booking.prepaymentAmount ?? 0).toLocaleString()} сум</span></span>
                    <span className="text-red-600">Остаток: <span className="font-medium">{(booking.paymentStatus === 'FullyPaid' ? 0 : booking.totalAmount - (booking.prepaymentAmount ?? 0)).toLocaleString()} сум</span></span>
                  </div>
                  {booking.notes && <p className="mt-1.5 text-xs text-gray-400 italic">"{booking.notes}"</p>}
                </div>

                {booking.status === 'Active' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => setPaymentModal(booking)}
                      className="text-xs text-green-700 hover:text-green-900 border border-green-200 hover:border-green-400 px-3 py-1 rounded-lg transition-colors"
                    >
                      {t('bookings.updatePayment')}
                    </button>
                    <button
                      onClick={() => { if (confirm(t('bookings.cancelConfirm'))) cancelMutation.mutate(booking.id) }}
                      disabled={cancelMutation.isPending}
                      className="text-xs text-red-600 hover:text-red-800 border border-red-200 hover:border-red-400 px-3 py-1 rounded-lg transition-colors"
                    >
                      {t('bookings.cancelBooking')}
                    </button>
                  </div>
                )}
              </div>
            </div>
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
