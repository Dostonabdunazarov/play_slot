import { useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { addDays, format } from 'date-fns'
import { ChevronRight, Hourglass, MapPin } from 'lucide-react'
import { getVenues } from '../api/venues'
import { getBookingsByVenueAndDate } from '../api/bookings'
import { getGuestRequests } from '../api/bookingRequests'
import { useAuthStore } from '../store/authStore'
import { dateLocale, formatMoney, hhmm, hourLabel } from '../utils/format'
import { minutesLeft, useRequestTokens } from '../utils/guestRequests'
import { dayLabel, timeRange, useNow } from '../utils/requestFormat'
import type { Booking, Venue } from '../types'

const MIN_LEAD_MS = 60 * 60 * 1000
const VISIBLE_SLOTS = 3

function freeHours(venue: Venue, date: string, bookings: Booking[] | undefined, now: number) {
  if (!bookings) return null
  const open = parseInt(venue.openTime.substring(0, 2))
  const close = parseInt(venue.closeTime.substring(0, 2))
  const busy = new Set(
    bookings
      .filter((b) => b.status === 'Active' || b.status === 'Pending')
      .map((b) => parseInt(b.startTime.substring(0, 2)))
  )
  const result: number[] = []
  for (let h = open; h < close; h++) {
    const start = new Date(`${date}T${String(h).padStart(2, '0')}:00:00`).getTime()
    if (!busy.has(h) && start - now >= MIN_LEAD_MS) result.push(h)
  }
  return result
}

function VenuePhoto({ venue }: { venue: Venue }) {
  const [broken, setBroken] = useState(false)
  if (!venue.imageUrl || broken)
    return (
      <div className="absolute inset-0 bg-night-2">
        <div className="pitch-lines absolute inset-0" />
        <div className="absolute inset-0 grid place-items-center">
          <img src="/logo-ball.svg" alt="" aria-hidden className="size-16 opacity-25 grayscale" />
        </div>
      </div>
    )
  return (
    <img
      src={venue.imageUrl}
      onError={() => setBroken(true)}
      alt=""
      loading="lazy"
      className="absolute inset-0 size-full object-cover transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.04]"
    />
  )
}

function VenueCard({
  venue,
  date,
  hours,
  nextDay,
}: {
  venue: Venue
  date: string
  hours: number[] | null
  nextDay: string
}) {
  const { t } = useTranslation()
  const visible = hours?.slice(0, VISIBLE_SLOTS) ?? []
  const rest = hours ? hours.length - visible.length : 0

  return (
    <article className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-float transition-colors duration-200 hover:border-line-strong">
      <Link to={`/venues/${venue.id}?date=${date}`} className="block">
        <div className="relative h-56 overflow-hidden sm:h-64">
          <VenuePhoto venue={venue} />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
          <span className="absolute top-3 left-3 rounded-full bg-black/55 px-3 py-1 text-[0.8125rem] font-bold text-white tabular backdrop-blur-sm">
            {formatMoney(venue.pricePerHour)} <span className="font-medium text-white/70">{t('venues.pricePerHour')}</span>
          </span>
          <div className="absolute inset-x-4 bottom-3 text-white">
            <h2 className="truncate text-[1.125rem] font-semibold tracking-tight transition-colors group-hover:text-accent">{venue.name}</h2>
            <div className="mt-0.5 flex items-center gap-1.5 text-[0.8125rem] text-white/65">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{venue.address}</span>
              <span className="ml-auto shrink-0 tabular">
                {hhmm(venue.openTime)}–{hhmm(venue.closeTime)}
              </span>
            </div>
          </div>
        </div>
      </Link>
      <div className="p-4">
        {hours === null ? (
          <div className="space-y-2" aria-hidden>
            <div className="h-3 w-28 rounded bg-sunken" />
            <div className="flex gap-1.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-8 w-16 rounded-lg bg-sunken" />
              ))}
            </div>
          </div>
        ) : hours.length > 0 ? (
          <>
            <div className="text-xs font-medium text-ink-3">{t('venues.freeHours', { count: hours.length })}</div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[0.8125rem] font-bold tabular">
              {visible.map((h) => (
                <Link
                  key={h}
                  to={`/venues/${venue.id}?date=${date}&hour=${h}`}
                  className="rounded-lg bg-accent/10 px-2.5 py-1.5 text-accent ring-1 ring-accent/35 transition-colors duration-150 hover:bg-accent hover:text-neon-ink"
                >
                  {hourLabel(h)}
                </Link>
              ))}
              {rest > 0 && (
                <Link
                  to={`/venues/${venue.id}?date=${date}`}
                  className="rounded-lg px-2 py-1.5 text-ink-3 transition-colors hover:text-ink"
                >
                  {t('venues.moreHours', { count: rest })}
                </Link>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="text-xs font-medium text-ink-3">{t('venues.allBusy')}</div>
            <Link
              to={`/venues/${venue.id}?date=${nextDay}`}
              className="mt-2 inline-flex items-center gap-1 rounded-lg border border-line bg-raised px-2.5 py-1.5 text-[0.8125rem] font-semibold text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
            >
              {t('venues.otherDay')}
              <ChevronRight className="size-3.5" aria-hidden />
            </Link>
          </>
        )}
      </div>
    </article>
  )
}

export default function VenuesPage() {
  const { t, i18n } = useTranslation()
  const now = useNow(60_000)
  const loggedIn = useAuthStore((s) => s.isAuthenticated())
  const tokens = useRequestTokens()
  const days = Array.from({ length: 5 }, (_, i) => format(addDays(new Date(), i), 'yyyy-MM-dd'))
  const [date, setDate] = useState(days[0])

  const { data: venues, isLoading } = useQuery({ queryKey: ['venues'], queryFn: getVenues })
  const bookingQueries = useQueries({
    queries: (venues ?? []).map((v) => ({
      queryKey: ['bookings', v.id, date],
      queryFn: () => getBookingsByVenueAndDate(v.id, date),
      refetchInterval: 60_000,
    })),
  })
  const { data: myRequests } = useQuery({
    queryKey: ['guest-requests', tokens],
    queryFn: () => getGuestRequests(tokens),
    enabled: !loggedIn && tokens.length > 0,
    refetchInterval: 60_000,
  })
  const pendingMine = myRequests?.filter((r) => r.status === 'Pending') ?? []
  const firstPending = pendingMine[0]

  const lang = i18n.language
  const locale = dateLocale(lang)
  const dayPhrase =
    date === days[0]
      ? t('venues.heroToday')
      : date === days[1]
        ? t('venues.heroTomorrow')
        : t('venues.heroOn', { date: format(new Date(`${date}T00:00:00`), 'EEEEEE, d MMMM', { locale }) })
  const chipLabel = (d: string, i: number) =>
    i === 0 ? t('requests.today') : i === 1 ? t('requests.tomorrow') : format(new Date(`${d}T00:00:00`), 'EEEEEE, d', { locale })
  const nextDay = format(addDays(new Date(`${date}T00:00:00`), 1), 'yyyy-MM-dd')

  return (
    <div className="relative text-ink">

      <div className="relative flex flex-wrap items-end justify-between gap-x-6 gap-y-5">
        <div className="min-w-0">
          <h1 className="text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl">
            {t('venues.heroTitle')}
            <br />
            <span className="gradient-text">{dayPhrase}</span>
          </h1>
          {venues && (
            <p className="mt-3 text-[0.9375rem] text-ink-3">
              {t('venues.heroSub', { venues: t('venues.count', { count: venues.length }) })}
            </p>
          )}
        </div>
        <div
          role="tablist"
          aria-label={t('venues.pickDay')}
          className="no-scrollbar -mx-4 flex max-w-[calc(100%+2rem)] gap-2 overflow-x-auto px-4 sm:mx-0 sm:max-w-full sm:px-0"
        >
          {days.map((d, i) => {
            const on = d === date
            return (
              <button
                key={d}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setDate(d)}
                className={`h-10 shrink-0 rounded-[10px] px-4 text-sm font-semibold whitespace-nowrap transition-colors duration-150 ${
                  on ? 'gradient-brand text-white shadow-sm' : 'border border-line bg-raised text-ink-2 hover:border-line-strong hover:text-ink'
                }`}
              >
                {chipLabel(d, i)}
              </button>
            )
          })}
        </div>
      </div>

      {firstPending && (
        <Link
          to={pendingMine.length === 1 ? `/r/${firstPending.token}` : '/my-requests'}
          className="relative mt-6 flex items-center gap-3 rounded-2xl border border-accent/25 bg-raised/70 px-4 py-3 text-sm backdrop-blur-md transition-colors hover:border-accent/50 sm:px-5"
        >
          <Hourglass className="size-4.5 shrink-0 text-accent" aria-hidden />
          <span className="min-w-0 flex-1 font-semibold">
            {pendingMine.length === 1
              ? t('venues.pendingWhen', {
                  when: `${dayLabel(firstPending.date, t, lang).toLowerCase()} ${timeRange(firstPending.startTime, firstPending.endTime)}`,
                })
              : t('guest.pendingBanner', { count: pendingMine.length })}
          </span>
          {pendingMine.length === 1 && (
            <span className="hidden shrink-0 text-ink-3 sm:inline">
              {firstPending.venueName} · {t('requests.minLeft', { count: minutesLeft(firstPending.expiresAt, now) })}
            </span>
          )}
          <ChevronRight className="size-4.5 shrink-0 text-ink-3" aria-hidden />
        </Link>
      )}

      {isLoading ? (
        <div className="relative mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4" role="status" aria-label={t('common.loading')}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl border border-line bg-surface" />
          ))}
        </div>
      ) : !venues?.length ? (
        <div className="relative mt-10 flex flex-col items-center py-16 text-center">
          <MapPin className="size-8 text-ink-3" aria-hidden />
          <p className="mt-4 font-semibold">{t('venues.noVenues')}</p>
          <p className="mt-1 text-sm text-ink-3">{t('venues.noVenuesHint')}</p>
        </div>
      ) : (
        <div className={`relative mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 ${loggedIn ? '2xl:grid-cols-4 xl:grid-cols-3' : 'xl:grid-cols-4'}`}>
          {venues.map((venue, i) => (
            <VenueCard
              key={venue.id}
              venue={venue}
              date={date}
              hours={freeHours(venue, date, bookingQueries[i]?.data, now)}
              nextDay={nextDay}
            />
          ))}
        </div>
      )}
    </div>
  )
}
