import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleCheck } from 'lucide-react'
import { Button, Sheet, inputClass } from './ui'
import { dayLabel, timeRange } from '../utils/requestFormat'
import type { StaffRequest } from '../types'

type ReasonChoice = 'slot_taken' | 'no_answer' | 'other' | 'none'

export function RejectSheet({
  request,
  loading,
  onClose,
  onConfirm,
}: {
  request: StaffRequest
  loading: boolean
  onClose: () => void
  onConfirm: (reason: string | null) => void
}) {
  const { t, i18n } = useTranslation()
  const [choice, setChoice] = useState<ReasonChoice>('slot_taken')
  const [other, setOther] = useState('')

  const options: { value: ReasonChoice; label: string }[] = [
    { value: 'slot_taken', label: t('requests.reasonSlotTaken') },
    { value: 'no_answer', label: t('requests.reasonNoAnswer') },
    { value: 'other', label: t('requests.reasonOther') },
    { value: 'none', label: t('requests.reasonNone') },
  ]

  const confirm = () => {
    if (choice === 'none') return onConfirm(null)
    if (choice === 'other') return onConfirm(other.trim() || null)
    onConfirm(choice)
  }

  return (
    <Sheet
      title={t('requests.rejectTitle')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" size="lg" className="flex-1" onClick={onClose}>
            {t('common.back')}
          </Button>
          <Button size="lg" className="flex-1 bg-due! hover:bg-due/90!" loading={loading} onClick={confirm}>
            {t('requests.reject')}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-2 tabular">
        {t('requests.rejectHint', {
          name: request.clientName,
          when: `${dayLabel(request.date, t, i18n.language)} ${timeRange(request.startTime, request.endTime)}`,
        })}
      </p>
      <fieldset className="mt-4">
        <legend className="mb-2 text-sm font-medium text-ink-2">{t('requests.reasonLabel')}</legend>
        <div className="space-y-2">
          {options.map((o) => {
            const on = choice === o.value
            return (
              <label
                key={o.value}
                className={`flex h-12 cursor-pointer items-center justify-between rounded-xl px-4 text-[0.9375rem] transition-colors duration-150 ${
                  on
                    ? 'border-2 border-brand bg-brand-soft font-semibold text-brand-ink'
                    : 'border border-line-strong font-medium text-ink hover:bg-sunken'
                }`}
              >
                <input
                  type="radio"
                  name="reject-reason"
                  value={o.value}
                  checked={on}
                  onChange={() => setChoice(o.value)}
                  className="sr-only"
                />
                {o.label}
                {on && <CircleCheck className="size-4.5" aria-hidden />}
              </label>
            )
          })}
        </div>
        {choice === 'other' && (
          <input
            className={`${inputClass} mt-3`}
            value={other}
            onChange={(e) => setOther(e.target.value)}
            placeholder={t('requests.reasonOtherPlaceholder')}
            maxLength={300}
            autoFocus
          />
        )}
      </fieldset>
    </Sheet>
  )
}
