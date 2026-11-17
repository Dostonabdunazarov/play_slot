import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ChevronRight, Clock, Hourglass, MapPin } from 'lucide-react'
import { getVenues } from '../api/venues'
import { getGuestRequests } from '../api/bookingRequests'
import { useAuthStore } from '../store/authStore'
import { useRequestTokens } from '../utils/guestRequests'
import { formatMoney, hhmm } from '../utils/format'
import { EmptyState, PageHeader, Skeleton } from '../components/ui'

export default function VenuesPage() {
  const { t } = useTranslation()
  const { data: venues, isLoading } = useQuery({ queryKey: ['venues'], queryFn: getVenues })
  const loggedIn = useAuthStore((s) => s.isAuthenticated())
  const tokens = useRequestTokens()
  const { data: myRequests } = useQuery({
    queryKey: ['guest-requests', tokens],
    queryFn: () => getGuestRequests(tokens),
    enabled: !loggedIn && tokens.length > 0,
    refetchInterval: 60_000,
  })
  const pendingMine = myRequests?.filter((r) => r.status === 'Pending').length ?? 0

  return (
    <div>
      <PageHeader
        title={t('venues.title')}
        description={venues?.length ? t('venues.count', { count: venues.length }) : undefined}
      />

      {!loggedIn && pendingMine > 0 && (
        <Link
          to={pendingMine === 1 ? `/r/${myRequests!.find((r) => r.status === 'Pending')!.token}` : '/my-requests'}
          className="mb-4 flex items-center gap-3 rounded-2xl border border-wait-line bg-wait-soft px-4 py-3 text-wait transition-colors hover:border-wait-dot"
        >
          <Hourglass className="size-4.5 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 text-[15px] font-semibold">
            {t('guest.pendingBanner', { count: pendingMine })}
          </span>
          <ChevronRight className="size-5 shrink-0" aria-hidden />
        </Link>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label={t('common.loading')}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-2xl" />
          ))}
        </div>
      ) : !venues?.length ? (
        <EmptyState icon={<MapPin className="size-6" />} title={t('venues.noVenues')} text={t('venues.noVenuesHint')} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {venues.map((venue) => (
            <Link
              key={venue.id}
              to={`/venues/${venue.id}`}
              className="group overflow-hidden rounded-2xl border border-line bg-surface transition-[border-color,box-shadow] duration-200 hover:border-line-strong hover:shadow-float"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-sunken">
                <img
                  src={venue.imageUrl || '/venue-placeholder.svg'}
                  onError={(e) => { e.currentTarget.src = '/venue-placeholder.svg' }}
                  alt={venue.name}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-500 ease-[var(--ease-out)] group-hover:scale-[1.03]"
                />
                <span className="absolute top-3 left-3 inline-flex h-8 items-center rounded-full bg-surface px-3 text-sm font-bold text-ink shadow-raise tabular">
                  {formatMoney(venue.pricePerHour)}
                  <span className="ml-1 font-medium text-ink-3">{t('venues.pricePerHour')}</span>
                </span>
              </div>
              <div className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-base font-bold tracking-[-0.01em] text-ink">{venue.name}</h2>
                  <div className="mt-1.5 space-y-1 text-sm text-ink-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 shrink-0" />
                      <span className="truncate">{venue.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5 tabular">
                      <Clock className="size-3.5 shrink-0" />
                      {hhmm(venue.openTime)}–{hhmm(venue.closeTime)}
                    </div>
                  </div>
                </div>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sunken text-ink-2 transition-colors duration-150 group-hover:bg-brand group-hover:text-white">
                  <ChevronRight className="size-5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
