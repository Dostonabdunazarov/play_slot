import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Check, Inbox, Phone } from 'lucide-react'
import { getStaffRequests } from '../api/bookingRequests'
import { Button, EmptyState, ListSkeleton, PageHeader, Segmented } from '../components/ui'
import { buttonClass } from '../components/styles'
import { DeadlineChip, RequestStatusPill } from '../components/requests'
import { dayLabel, timeRange, useNow } from '../utils/requestFormat'
import { RejectSheet } from '../components/RequestDecision'
import { useRequestDecision } from '../components/useRequestDecision'
import { formatMoney, formatPhone, phoneLink } from '../utils/format'
import type { StaffRequest } from '../types'

function RequestCard({
  r,
  now,
  onReject,
  approving,
  onApprove,
}: {
  r: StaffRequest
  now: number
  onReject: () => void
  approving: boolean
  onApprove: () => void
}) {
  const { t, i18n } = useTranslation()
  const pending = r.status === 'Pending'
  return (
    <article className="rounded-2xl border border-line bg-surface p-4">
      <Link to={`/requests/${r.id}`} className="-m-1 flex items-start justify-between gap-3 rounded-xl p-1">
        <div className="min-w-0">
          <div className="text-[17px] font-bold tracking-[-0.01em] text-ink tabular">
            {dayLabel(r.date, t, i18n.language)} · {timeRange(r.startTime, r.endTime)}
          </div>
          <div className="mt-0.5 text-sm text-ink-2">
            {r.venueName} · {t('guest.hoursShort', { count: r.hours })} ·{' '}
            <span className="whitespace-nowrap tabular">{formatMoney(r.totalAmount)}</span>
          </div>
        </div>
        {pending ? (
          <DeadlineChip expiresAt={r.expiresAt} now={now} />
        ) : (
          <RequestStatusPill status={r.status} size="sm" />
        )}
      </Link>
      <div className="mt-3 flex items-center gap-3 border-t border-line pt-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold text-ink">{r.clientName}</div>
          <div className="text-sm text-ink-3 tabular">{formatPhone(r.clientPhone)}</div>
        </div>
        <a
          href={phoneLink(r.clientPhone)}
          aria-label={t('bookings.callClient')}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-line-strong text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
        >
          <Phone className="size-4.5" />
        </a>
      </div>
      {r.comment && <p className="mt-2 rounded-lg bg-sunken px-3 py-2 text-sm text-ink-2">{r.comment}</p>}
      {pending && (
        <div className="mt-3 grid grid-cols-[auto_1fr] gap-2">
          <Button variant="danger" onClick={onReject}>
            {t('requests.reject')}
          </Button>
          <Button onClick={onApprove} loading={approving} icon={<Check className="size-4.5" />}>
            {t('requests.approve')}
          </Button>
        </div>
      )}
    </article>
  )
}

export default function RequestsPage() {
  const { t } = useTranslation()
  const now = useNow()
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const [rejecting, setRejecting] = useState<StaffRequest | null>(null)
  const { approve, reject } = useRequestDecision()

  const { data = [], isLoading } = useQuery({
    queryKey: ['staff-requests', filter],
    queryFn: () => getStaffRequests(filter),
    refetchInterval: 30_000,
  })

  const pendingCount = filter === 'pending' ? data.length : data.filter((r) => r.status === 'Pending').length

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={t('requests.title')}
        description={pendingCount ? t('requests.waitingCount', { count: pendingCount }) : undefined}
        actions={
          <Segmented
            label={t('requests.title')}
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'pending', label: t('requests.filterPending') },
              { value: 'all', label: t('requests.filterAll') },
            ]}
          />
        }
      />

      {isLoading ? (
        <ListSkeleton rows={3} className="h-44" />
      ) : data.length === 0 ? (
        <EmptyState
          icon={<Inbox className="size-6" />}
          title={filter === 'pending' ? t('requests.emptyTitle') : t('requests.emptyAllTitle')}
          text={t('requests.emptyText')}
          action={
            filter === 'pending' ? undefined : (
              <Link to="/venues" className={buttonClass('secondary')}>
                {t('nav.venues')}
              </Link>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {data.map((r) => (
            <RequestCard
              key={r.id}
              r={r}
              now={now}
              onReject={() => setRejecting(r)}
              approving={approve.isPending && approve.variables === r.id}
              onApprove={() => approve.mutate(r.id)}
            />
          ))}
        </div>
      )}

      {rejecting && (
        <RejectSheet
          request={rejecting}
          loading={reject.isPending}
          onClose={() => setRejecting(null)}
          onConfirm={(reason) =>
            reject.mutate({ id: rejecting.id, reason }, { onSettled: () => setRejecting(null) })
          }
        />
      )}
    </div>
  )
}
