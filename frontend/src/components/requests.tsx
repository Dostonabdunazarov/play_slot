import { useTranslation } from 'react-i18next'
import { Timer } from 'lucide-react'
import type { RequestStatus } from '../types'
import { minutesLeft } from '../utils/guestRequests'

const pillTone: Record<RequestStatus, { box: string; dot: string }> = {
  Pending: { box: 'bg-wait-soft text-wait', dot: 'bg-wait-dot' },
  Approved: { box: 'bg-paid-soft text-paid', dot: 'bg-paid' },
  Rejected: { box: 'bg-due-soft text-due', dot: 'bg-due' },
  Expired: { box: 'bg-sunken text-ink-2', dot: 'bg-ink-3' },
  CancelledByGuest: { box: 'bg-sunken text-ink-2', dot: 'bg-ink-3' },
}

export function RequestStatusPill({
  status,
  label,
  size = 'md',
}: {
  status: RequestStatus
  label?: string
  size?: 'sm' | 'md'
}) {
  const { t } = useTranslation()
  const tone = pillTone[status]
  const sizeClass = size === 'sm' ? 'h-6 px-2.5 text-xs' : 'h-7 px-3 text-[13px]'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${sizeClass} ${tone.box}`}>
      <span className={`size-1.5 rounded-full ${tone.dot}`} aria-hidden />
      {label ?? t(`requests.statuses.${status.toLowerCase()}`)}
    </span>
  )
}

export function DeadlineChip({ expiresAt, now, long = false }: { expiresAt: string; now: number; long?: boolean }) {
  const { t } = useTranslation()
  const left = minutesLeft(expiresAt, now)
  const urgent = left < 15
  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-semibold tabular ${
        urgent ? 'bg-due-soft text-due' : 'bg-sunken text-ink-2'
      }`}
    >
      <Timer className="size-3" aria-hidden />
      {t(long ? 'requests.minLeftLong' : 'requests.minLeft', { count: left })}
    </span>
  )
}
