import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ChevronRight, Inbox } from 'lucide-react'
import { getGuestRequests } from '../api/bookingRequests'
import { EmptyState, ListSkeleton, PageHeader } from '../components/ui'
import { buttonClass } from '../components/styles'
import { DeadlineChip, RequestStatusPill } from '../components/requests'
import { dayLabel, timeRange, useNow } from '../utils/requestFormat'
import { formatMoney } from '../utils/format'
import { forgetRequests, useRequestTokens } from '../utils/guestRequests'

export default function MyRequestsPage() {
  const { t, i18n } = useTranslation()
  const tokens = useRequestTokens()
  const now = useNow()

  const { data, isLoading } = useQuery({
    queryKey: ['guest-requests', tokens],
    queryFn: () => getGuestRequests(tokens),
    enabled: tokens.length > 0,
    refetchInterval: 30_000,
  })

  useEffect(() => {
    if (!data) return
    const known = new Set(data.map((r) => r.token))
    const missing = tokens.filter((tk) => !known.has(tk))
    if (missing.length) forgetRequests(missing)
  }, [data, tokens])

  const empty = (
    <EmptyState
      icon={<Inbox className="size-6" />}
      title={t('guest.myRequestsEmpty')}
      text={t('guest.myRequestsEmptyText')}
      action={
        <Link to="/venues" className={buttonClass('primary')}>
          {t('guest.pickVenue')}
        </Link>
      }
    />
  )

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t('guest.myRequests')} />
      {tokens.length === 0 ? (
        empty
      ) : isLoading ? (
        <ListSkeleton rows={3} className="h-24" />
      ) : !data?.length ? (
        empty
      ) : (
        <ul className="space-y-3">
          {data.map((r) => (
            <li key={r.token}>
              <Link
                to={`/r/${r.token}`}
                className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4 transition-[border-color,box-shadow] duration-200 hover:border-line-strong hover:shadow-raise"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <RequestStatusPill status={r.status} size="sm" />
                    {r.status === 'Pending' && <DeadlineChip expiresAt={r.expiresAt} now={now} />}
                  </div>
                  <div className="mt-2 text-[17px] font-bold tracking-[-0.01em] text-ink tabular">
                    {dayLabel(r.date, t, i18n.language)} · {timeRange(r.startTime, r.endTime)}
                  </div>
                  <div className="mt-0.5 truncate text-sm text-ink-2">
                    {r.venueName} · <span className="whitespace-nowrap tabular">{formatMoney(r.totalAmount)}</span>
                  </div>
                </div>
                <ChevronRight className="size-5 shrink-0 text-ink-3" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
