import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDate, formatMoney, hhmm } from '../utils/format'
import { Button, Field, Sheet, inputClass } from './ui'
import { paymentDotClass } from './styles'
import type { Booking, PaymentStatus } from '../types'

export default function PaymentModal({
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
  const { t, i18n } = useTranslation()
  const [status, setStatus] = useState<PaymentStatus>(booking.paymentStatus)
  const [prepayment, setPrepayment] = useState<string>(booking.prepaymentAmount?.toString() ?? '')

  return (
    <Sheet
      title={t('bookings.updatePayment')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="lg" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            size="lg"
            className="flex-1"
            loading={loading}
            onClick={() => onSave(status, prepayment ? parseFloat(prepayment) : undefined)}
          >
            {t('common.save')}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="rounded-xl bg-sunken px-3.5 py-3 text-sm">
          <div className="font-semibold text-ink">{booking.clientName}</div>
          <div className="text-ink-2 tabular">
            {formatDate(booking.date, i18n.language)} · {hhmm(booking.startTime)} · {formatMoney(booking.totalAmount)}
          </div>
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-ink-2">{t('bookings.paymentStatus')}</legend>
          <div className="grid grid-cols-3 gap-2">
            {(['Unpaid', 'Prepaid', 'FullyPaid'] as PaymentStatus[]).map((s) => {
              const on = status === s
              return (
                <label
                  key={s}
                  className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border px-2 py-3 text-center text-sm font-semibold transition-colors duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand ${
                    on ? 'border-brand bg-brand-soft text-ink' : 'border-line-strong text-ink-2 hover:bg-sunken'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentStatus"
                    value={s}
                    checked={on}
                    onChange={() => setStatus(s)}
                    className="sr-only"
                  />
                  <span className={`size-2.5 rounded-full ${paymentDotClass(s)}`} aria-hidden />
                  {t(`bookings.paymentStatuses.${s.toLowerCase()}`)}
                </label>
              )
            })}
          </div>
        </fieldset>

        {status === 'Prepaid' && (
          <Field label={t('bookings.prepayment')} htmlFor="prepayment">
            <input
              id="prepayment"
              type="number"
              inputMode="numeric"
              min={0}
              value={prepayment}
              onChange={(e) => setPrepayment(e.target.value)}
              className={`${inputClass} tabular`}
            />
          </Field>
        )}
      </div>
    </Sheet>
  )
}
