import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { BarChart3, ChevronRight } from 'lucide-react'
import { getDashboardStats } from '../../api/stats'
import { formatMoney } from '../../utils/format'
import { Card, EmptyState, PageHeader, Segmented, Skeleton } from '../../components/ui'
import type { DashboardStats } from '../../types'

// A quick date range shortcut in days back from today. 0 = today only.
const RANGES = [0, 7, 30, 90] as const

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function Kpi({
  label,
  value,
  unit,
  tone = 'ink',
  to,
}: {
  label: string
  value: string
  unit?: string
  tone?: 'ink' | 'paid' | 'due'
  to?: string
}) {
  const toneClass = tone === 'paid' ? 'text-paid' : tone === 'due' ? 'text-due' : 'text-ink'
  const body = (
    <>
      <div className="flex items-center justify-between text-sm text-ink-3">
        {label}
        {to && <ChevronRight className="size-4" />}
      </div>
      <div className={`mt-1.5 text-2xl font-bold tracking-[-0.02em] tabular lg:text-[28px] ${toneClass}`}>
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-ink-3">{unit}</span>}
      </div>
    </>
  )
  const cls = 'block bg-surface p-4 lg:p-5'
  return to ? (
    <Link to={to} className={`${cls} transition-colors hover:bg-sunken`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}

export default function AdminDashboardPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [rangeDays, setRangeDays] = useState<number>(30)

  const from = isoDaysAgo(rangeDays)
  const { data, isLoading } = useQuery({
    queryKey: ['dashboardStats', rangeDays],
    queryFn: () => getDashboardStats(from),
  })

  const range = (
    <Segmented
      label={t('dashboard.period')}
      value={rangeDays}
      onChange={setRangeDays}
      options={RANGES.map((r) => ({
        value: r,
        label: r === 0 ? t('dashboard.today') : t('dashboard.lastDays', { count: r }),
      }))}
    />
  )

  if (isLoading)
    return (
      <div>
        <PageHeader title={t('dashboard.title')} actions={range} />
        <div role="status" aria-label={t('common.loading')} className="space-y-4">
          <Skeleton className="h-48 rounded-2xl lg:h-28" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    )

  if (!data)
    return (
      <div>
        <PageHeader title={t('dashboard.title')} actions={range} />
        <EmptyState icon={<BarChart3 className="size-6" />} title={t('common.noData')} />
      </div>
    )

  const stats: DashboardStats = data
  const maxHours = Math.max(1, ...stats.venueLoad.map((v) => v.hoursBooked))
  const som = t('dashboard.som')

  return (
    <div>
      <PageHeader title={t('dashboard.title')} actions={range} />

      <Card className="mb-5 overflow-hidden">
        <div className="grid grid-cols-2 gap-px bg-line lg:grid-cols-4">
        <Kpi label={t('dashboard.paidRevenue')} value={formatMoney(stats.paidRevenue)} unit={som} tone="paid" />
        <Kpi label={t('dashboard.expectedRevenue')} value={formatMoney(stats.expectedRevenue)} unit={som} />
        <Kpi
          label={t('dashboard.outstanding')}
          value={formatMoney(stats.outstandingAmount)}
          unit={som}
          tone={stats.outstandingAmount > 0 ? 'due' : 'ink'}
        />
        <Kpi label={t('dashboard.activeBookings')} value={`${stats.activeBookings}`} to="/admin/bookings" />
        </div>
      </Card>

      <Card>
        <div className="flex items-baseline justify-between gap-3 px-4 pt-4 pb-3 lg:px-5">
          <h2 className="text-lg font-bold tracking-[-0.01em] text-ink">{t('dashboard.venueLoad')}</h2>
          <span className="text-xs text-ink-3">{som}</span>
        </div>
        {!stats.venueLoad.length ? (
          <EmptyState icon={<BarChart3 className="size-6" />} title={t('common.noData')} text={t('dashboard.noLoadHint')} />
        ) : (
          <>
            <ul className="divide-y divide-line border-t border-line md:hidden">
              {stats.venueLoad.map((v) => (
                <li key={v.venueId}>
                  <button
                    type="button"
                    onClick={() => navigate(`/venues/${v.venueId}`)}
                    className="block w-full px-4 py-3 text-left transition-colors hover:bg-sunken"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate font-semibold text-ink">{v.venueName}</span>
                      <span className="shrink-0 text-sm text-ink-3 tabular">
                        {v.hoursBooked} {t('dashboard.hoursShort')} · {v.bookings} {t('dashboard.bookingsShort')}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sunken">
                      <div className="h-full rounded-full bg-brand" style={{ width: `${(v.hoursBooked / maxHours) * 100}%` }} />
                    </div>
                    <div className="mt-2 flex justify-between text-sm tabular">
                      <span className="text-paid">{formatMoney(v.paidRevenue)}</span>
                      <span className={v.outstandingAmount > 0 ? 'text-due' : 'text-ink-3'}>
                        {t('bookings.remaining')}: {formatMoney(v.outstandingAmount)}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y border-line bg-sunken/60 text-left text-xs font-semibold text-ink-3">
                    <th className="py-2.5 pr-3 pl-5 font-semibold">{t('bookings.venue')}</th>
                    <th className="w-[28%] px-3 py-2.5 font-semibold">{t('dashboard.hoursBooked')}</th>
                    <th className="px-3 py-2.5 text-right font-semibold">{t('dashboard.bookingsCount')}</th>
                    <th className="px-3 py-2.5 text-right font-semibold">{t('dashboard.paidRevenue')}</th>
                    <th className="py-2.5 pr-5 pl-3 text-right font-semibold">{t('dashboard.outstanding')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {stats.venueLoad.map((v) => (
                    <tr
                      key={v.venueId}
                      onClick={() => navigate(`/venues/${v.venueId}`)}
                      className="cursor-pointer transition-colors hover:bg-sunken/60"
                    >
                      <td className="py-3 pr-3 pl-5 font-semibold text-ink">{v.venueName}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken">
                            <div className="h-full rounded-full bg-brand" style={{ width: `${(v.hoursBooked / maxHours) * 100}%` }} />
                          </div>
                          <span className="w-8 text-right text-ink-2 tabular">{v.hoursBooked}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right text-ink-2 tabular">{v.bookings}</td>
                      <td className="px-3 py-3 text-right font-semibold text-paid tabular">{formatMoney(v.paidRevenue)}</td>
                      <td className={`py-3 pr-5 pl-3 text-right font-semibold tabular ${v.outstandingAmount > 0 ? 'text-due' : 'text-ink-3'}`}>
                        {formatMoney(v.outstandingAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
