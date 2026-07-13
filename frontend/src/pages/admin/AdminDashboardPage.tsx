import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { TrendingUp, CalendarCheck, Wallet, AlertCircle } from 'lucide-react'
import { getDashboardStats } from '../../api/stats'
import { formatMoney } from '../../utils/format'
import type { DashboardStats } from '../../types'

// A quick date range shortcut in days back from today. 0 = today only.
const RANGES = [0, 7, 30, 90] as const

function isoDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function StatCard({
  icon,
  label,
  value,
  accent,
  to,
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent: string
  to?: string
}) {
  const content = (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}>{icon}</div>
      <div className="min-w-0">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-lg font-bold text-gray-900 truncate">{value}</div>
      </div>
    </div>
  )

  const base = 'bg-white rounded-xl shadow-sm border border-gray-100 p-4'

  if (to) {
    return (
      <Link to={to} className={`${base} block hover:shadow-md hover:border-gray-200 transition-shadow`}>
        {content}
      </Link>
    )
  }

  return <div className={base}>{content}</div>
}

export default function AdminDashboardPage() {
  const { t } = useTranslation()
  const [rangeDays, setRangeDays] = useState<number>(30)

  const from = isoDaysAgo(rangeDays)
  const { data, isLoading } = useQuery({
    queryKey: ['dashboardStats', rangeDays],
    queryFn: () => getDashboardStats(from),
  })

  if (isLoading) return <div className="text-center py-20 text-gray-500">{t('common.loading')}</div>
  if (!data) return <div className="text-center py-20 text-gray-500">{t('common.noData')}</div>

  const stats: DashboardStats = data

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRangeDays(r)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                rangeDays === r ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {r === 0 ? t('dashboard.today') : t('dashboard.lastDays', { count: r })}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={<Wallet className="w-5 h-5 text-green-700" />}
          accent="bg-green-100"
          label={t('dashboard.paidRevenue')}
          value={`${formatMoney(stats.paidRevenue)} ${t('dashboard.som')}`}
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-blue-700" />}
          accent="bg-blue-100"
          label={t('dashboard.expectedRevenue')}
          value={`${formatMoney(stats.expectedRevenue)} ${t('dashboard.som')}`}
        />
        <StatCard
          icon={<CalendarCheck className="w-5 h-5 text-violet-700" />}
          accent="bg-violet-100"
          label={t('dashboard.activeBookings')}
          value={`${stats.activeBookings}`}
          to="/admin/bookings"
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5 text-orange-700" />}
          accent="bg-orange-100"
          label={t('dashboard.outstanding')}
          value={`${formatMoney(stats.outstandingAmount)} ${t('dashboard.som')}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Venue load */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-4">{t('dashboard.venueLoad')}</h2>
          {!stats.venueLoad.length ? (
            <div className="text-sm text-gray-400 py-8 text-center">{t('common.noData')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                    <th className="py-2 pr-2 font-medium">{t('bookings.venue')}</th>
                    <th className="py-2 px-2 font-medium text-right">{t('dashboard.bookingsCount')}</th>
                    <th className="py-2 px-2 font-medium text-right">{t('dashboard.hoursBooked')}</th>
                    <th className="py-2 px-2 font-medium text-right">{t('dashboard.paidRevenue')}</th>
                    <th className="py-2 pl-2 font-medium text-right">{t('dashboard.outstanding')}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.venueLoad.map((v) => (
                    <tr key={v.venueId} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 pr-2 text-gray-800 font-medium">{v.venueName}</td>
                      <td className="py-2 px-2 text-right text-gray-600">{v.bookings}</td>
                      <td className="py-2 px-2 text-right text-gray-600">{v.hoursBooked}</td>
                      <td className="py-2 px-2 text-right text-green-700 font-medium">{formatMoney(v.paidRevenue)}</td>
                      <td className={`py-2 pl-2 text-right font-medium ${v.outstandingAmount > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{formatMoney(v.outstandingAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
