import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { TrendingUp, CalendarCheck, Wallet, AlertCircle } from 'lucide-react'
import { getDashboardStats } from '../../api/stats'
import { formatMoney, formatDayShort } from '../../utils/format'
import type { DashboardStats } from '../../types'

// A quick date range shortcut in days back from today.
const RANGES = [7, 30, 90] as const

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
}: {
  icon: React.ReactNode
  label: string
  value: string
  accent: string
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}>{icon}</div>
        <div className="min-w-0">
          <div className="text-xs text-gray-500">{label}</div>
          <div className="text-lg font-bold text-gray-900 truncate">{value}</div>
        </div>
      </div>
    </div>
  )
}

function BarChart({
  data,
  color,
  valueFmt,
}: {
  data: { label: string; value: number }[]
  color: string
  valueFmt: (v: number) => string
}) {
  const { t } = useTranslation()
  const max = Math.max(1, ...data.map((d) => d.value))
  if (!data.length) return <div className="text-sm text-gray-400 py-8 text-center">{t('common.noData')}</div>

  return (
    <div className="flex items-end gap-1 h-48 overflow-x-auto pb-1">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center justify-end flex-1 min-w-[24px] group h-full">
          <div className="text-[10px] text-gray-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {valueFmt(d.value)}
          </div>
          <div
            className={`w-full rounded-t ${color} transition-all`}
            style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? '2px' : '0' }}
            title={`${d.label}: ${valueFmt(d.value)}`}
          />
          <div className="text-[9px] text-gray-400 mt-1 rotate-0 whitespace-nowrap">{d.label}</div>
        </div>
      ))}
    </div>
  )
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
              {t('dashboard.lastDays', { count: r })}
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
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5 text-orange-700" />}
          accent="bg-orange-100"
          label={t('dashboard.outstanding')}
          value={`${formatMoney(stats.outstandingAmount)} ${t('dashboard.som')}`}
        />
      </div>

      {/* Revenue by day */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">{t('dashboard.revenueByDay')}</h2>
        <BarChart
          data={stats.revenueByDay.map((p) => ({ label: formatDayShort(p.date), value: p.paidRevenue }))}
          color="bg-green-500"
          valueFmt={formatMoney}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak hours */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-4">{t('dashboard.peakHours')}</h2>
          <BarChart
            data={stats.bookingsByHour.map((h) => ({
              label: `${h.hour}:00`,
              value: h.bookings,
            }))}
            color="bg-orange-400"
            valueFmt={(v) => `${v}`}
          />
        </div>

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
                    <th className="py-2 pl-2 font-medium text-right">{t('dashboard.paidRevenue')}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.venueLoad.map((v) => (
                    <tr key={v.venueId} className="border-b border-gray-50 last:border-0">
                      <td className="py-2 pr-2 text-gray-800 font-medium">{v.venueName}</td>
                      <td className="py-2 px-2 text-right text-gray-600">{v.bookings}</td>
                      <td className="py-2 px-2 text-right text-gray-600">{v.hoursBooked}</td>
                      <td className="py-2 pl-2 text-right text-green-700 font-medium">{formatMoney(v.paidRevenue)}</td>
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
