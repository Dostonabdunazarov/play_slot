import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Check, Phone, SearchX, Send } from 'lucide-react'
import { getStaffRequest } from '../api/bookingRequests'
import { getBookingsByVenueAndDate } from '../api/bookings'
import { Button, Card, EmptyState, Skeleton } from '../components/ui'
import { buttonClass, paymentDotClass } from '../components/styles'
import { DeadlineChip, RequestStatusPill } from '../components/requests'
import { clockTime, dayLabel, reasonLabel, timeRange, useNow } from '../utils/requestFormat'
import { RejectSheet } from '../components/RequestDecision'
import { useRequestDecision } from '../components/useRequestDecision'
import { formatDate, formatMoney, formatPhone, hourLabel, phoneLink } from '../utils/format'
import type { Booking, StaffRequest } from '../types'

function Nearby({ r }: { r: StaffRequest }) {
  const { t } = useTranslation()
  const { data: bookings } = useQuery({
    queryKey: ['bookings', r.venueId, r.date],
    queryFn: () => getBookingsByVenueAndDate(r.venueId, r.date),
  })
  if (!bookings) return <Skeleton className="h-40" />

  const start = parseInt(r.startTime.substring(0, 2))
  const end = parseInt(r.endTime.substring(0, 2))
  const byHour = new Map<number, Booking>()
  bookings.forEach((b) => {
    if (b.status === 'Active' || b.status === 'Pending') byHour.set(parseInt(b.startTime.substring(0, 2)), b)
  })
  const hours = Array.from({ length: end - start + 2 }, (_, i) => start - 1 + i).filter((h) => h >= 0 && h < 24)

  return (
    <Card className="p-4">
      <div className="text-sm font-semibold text-ink-2">{t('requests.nearby')}</div>
      <ol className="mt-2.5 space-y-1.5 text-sm tabular">
        {hours.map((h) => {
          const mine = h >= start && h < end
          const b = byHour.get(h)
          let cell
          if (mine)
            cell = (
              <span className="hatch flex h-9 flex-1 items-center rounded-lg border border-wait-line px-3 font-semibold text-wait">
                {t('requests.thisRequest')}
              </span>
            )
          else if (b?.status === 'Pending')
            cell = (
              <span className="hatch flex h-9 min-w-0 flex-1 items-center rounded-lg border border-wait-line px-3 font-medium text-wait">
                <span className="truncate">{b.clientName}</span>
              </span>
            )
          else if (b)
            cell = (
              <span className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg bg-sunken px-3 font-medium text-ink">
                <span className={`size-1.5 shrink-0 rounded-full ${paymentDotClass(b.paymentStatus)}`} aria-hidden />
                <span className="truncate">{b.clientName === 'Занято' ? t('bookings.booked') : b.clientName}</span>
              </span>
            )
          else
            cell = (
              <span className="flex h-9 flex-1 items-center rounded-lg border border-dashed border-brand/40 bg-brand-soft/60 px-3 font-medium text-brand-ink">
                {t('bookings.free')}
              </span>
            )
          return (
            <li key={h} className="flex items-center gap-3">
              <span className={`w-11 font-semibold ${mine ? 'text-ink' : 'text-ink-3'}`}>{hourLabel(h)}</span>
              {cell}
            </li>
          )
        })}
      </ol>
    </Card>
  )
}

export default function RequestDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { t, i18n } = useTranslation()
  const now = useNow(15_000)
  const [rejecting, setRejecting] = useState(false)
  const { approve, reject } = useRequestDecision()

  const { data: r, isLoading, isError } = useQuery({
    queryKey: ['staff-request', id],
    queryFn: () => getStaffRequest(id),
    retry: false,
    refetchInterval: (q) => (q.state.data?.status === 'Pending' ? 30_000 : false),
  })

  const back = (
    <Link
      to="/requests"
      className="-ml-2 inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
    >
      <ArrowLeft className="size-4" />
      {t('requests.title')}
    </Link>
  )

  if (isLoading)
    return (
      <div className="mx-auto max-w-lg space-y-3" role="status" aria-label={t('common.loading')}>
        <Skeleton className="h-24" />
        <Skeleton className="h-36" />
        <Skeleton className="h-40" />
      </div>
    )

  if (isError || !r)
    return (
      <EmptyState
        icon={<SearchX className="size-6" />}
        title={t('requests.notFound')}
        action={
          <Link to="/requests" className={buttonClass('secondary')}>
            {t('common.back')}
          </Link>
        }
      />
    )

  const pending = r.status === 'Pending'
  const reason = reasonLabel(r.rejectReason, t)

  return (
    <div className={`mx-auto max-w-lg ${pending ? 'pb-24 lg:pb-0' : ''}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        {back}
        {pending && <DeadlineChip expiresAt={r.expiresAt} now={now} long />}
      </div>

      <RequestStatusPill status={r.status} label={pending ? t('requests.staffPending') : undefined} />
      <h1 className="mt-3 text-[1.625rem] font-bold leading-tight tracking-[-0.02em] text-ink tabular">
        {timeRange(r.startTime, r.endTime)}
      </h1>
      <p className="mt-1 text-[0.9375rem] text-ink-2">
        {dayLabel(r.date, t, i18n.language)}, {formatDate(r.date, i18n.language)} · {r.venueName}
      </p>
      {!pending && r.decidedAt && (
        <p className="mt-2 text-sm text-ink-3 tabular">
          {t('requests.decidedBy', {
            status: t(`requests.statuses.${r.status.toLowerCase()}`),
            name: r.decidedByName ?? '—',
            time: clockTime(r.decidedAt),
          })}
          {reason ? ` · ${reason}` : ''}
        </p>
      )}

      <div className="mt-4 space-y-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[1.0625rem] font-semibold text-ink">{r.clientName}</div>
              <div className="text-[0.9375rem] text-ink-2 tabular">{formatPhone(r.clientPhone)}</div>
            </div>
            <a href={phoneLink(r.clientPhone)} className={buttonClass('secondary', 'md', 'shrink-0')}>
              <Phone className="size-4" />
              {t('guest.call')}
            </a>
          </div>
          {r.comment && <p className="mt-3 rounded-lg bg-sunken px-3 py-2 text-sm text-ink-2">{r.comment}</p>}
          <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-sm tabular">
            <div>
              <dt className="text-xs text-ink-3">{t('requests.hours')}</dt>
              <dd className="font-semibold text-ink">{r.hours}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-3">{t('guest.sum')}</dt>
              <dd className="font-semibold text-ink">{formatMoney(r.totalAmount)}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink-3">{t('requests.prepayment')}</dt>
              <dd className="font-semibold text-ink">{r.prepaymentAmount ? formatMoney(r.prepaymentAmount) : '—'}</dd>
            </div>
          </dl>
        </Card>

        {pending && <Nearby r={r} />}

        <p className="text-center text-xs text-ink-3 tabular">
          {t('requests.source', {
            time: clockTime(r.createdAt),
            lang: r.language === 'uz' ? t('requests.langUz') : t('requests.langRu'),
          })}
        </p>
        {r.telegramLinked && (
          <p className="flex items-center justify-center gap-1.5 text-xs text-ink-3">
            <Send className="size-3" aria-hidden />
            {t('requests.telegramLinked')}
          </p>
        )}
      </div>

      {pending && (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 grid grid-cols-[auto_1fr] gap-2 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur-sm lg:static lg:mt-5 lg:border-0 lg:bg-transparent lg:p-0">
          <Button variant="danger" size="lg" onClick={() => setRejecting(true)}>
            {t('requests.reject')}
          </Button>
          <Button
            size="lg"
            loading={approve.isPending}
            onClick={() => approve.mutate(r.id)}
            icon={<Check className="size-4.5" />}
          >
            {t('requests.approveLong')}
          </Button>
        </div>
      )}

      {rejecting && (
        <RejectSheet
          request={r}
          loading={reject.isPending}
          onClose={() => setRejecting(false)}
          onConfirm={(reason) => reject.mutate({ id: r.id, reason }, { onSettled: () => setRejecting(false) })}
        />
      )}
    </div>
  )
}
