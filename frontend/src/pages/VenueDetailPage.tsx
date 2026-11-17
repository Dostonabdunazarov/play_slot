import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Clock3,
  Hourglass,
  MapPin,
  Phone,
  Plus,
  SearchX,
  Wallet,
} from 'lucide-react'
import { getVenue } from '../api/venues'
import { dateLocale, formatMoney, hhmm, hourLabel, phoneLink } from '../utils/format'
import { getBookingsByVenueAndDate } from '../api/bookings'
import { createGuestRequest } from '../api/bookingRequests'
import { useAuthStore } from '../store/authStore'
import DateStrip from '../components/DateStrip'
import { Button, Card, EmptyState, Field, MoneyLine, PaymentBadge, Sheet, Skeleton, inputClass, textareaClass } from '../components/ui'
import { buttonClass, paymentDotClass } from '../components/styles'
import { useNow } from '../utils/requestFormat'
import { apiErrorCode, formatPhoneInput, phoneDigits, rememberRequest } from '../utils/guestRequests'
import type { Booking, PaymentStatus, Venue } from '../types'

const MAX_HOURS = 3
const MIN_LEAD_MS = 60 * 60 * 1000
const CONTACT_KEY = 'guestContact'

const slotTone: Record<PaymentStatus, string> = {
  FullyPaid: 'bg-paid-soft',
  Prepaid: 'bg-pre-soft',
  Unpaid: 'bg-due-soft',
}

interface Selection {
  start: number
  count: number
}

function BookedSlot({ booking }: { booking: Booking }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <div className={`rounded-xl ${slotTone[booking.paymentStatus]}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-12 w-full items-center gap-3 px-3.5 py-2 text-left"
      >
        <span className={`size-2 shrink-0 rounded-full ${paymentDotClass(booking.paymentStatus)}`} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-ink">{booking.clientName}</span>
          <span className="block truncate text-xs text-ink-2 tabular">{booking.clientPhone}</span>
        </span>
        <span className="hidden sm:block">
          <PaymentBadge status={booking.paymentStatus} className="bg-surface/70" />
        </span>
        <ChevronDown
          className={`size-4 shrink-0 text-ink-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="space-y-3 border-t border-ink/5 px-3.5 pt-3 pb-3.5">
          <span className="block sm:hidden">
            <PaymentBadge status={booking.paymentStatus} className="bg-surface/70" />
          </span>
          <MoneyLine booking={booking} />
          {booking.notes && <p className="text-sm text-ink-2">{booking.notes}</p>}
          <a href={phoneLink(booking.clientPhone)} className={buttonClass('secondary', 'sm', 'w-full sm:w-auto')}>
            <Phone className="size-4" />
            {t('bookings.callClient')}
          </a>
        </div>
      )}
    </div>
  )
}

function PendingSlot({ booking, staff }: { booking: Booking; staff: boolean }) {
  const { t } = useTranslation()
  const body = (
    <>
      <Hourglass className="size-4 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 truncate">
        {staff ? booking.clientName : t('guest.pending')}
      </span>
      {staff && <span className="shrink-0 text-xs font-medium">{t('guest.pending')}</span>}
    </>
  )
  const cls =
    'hatch flex min-h-12 w-full items-center gap-2 rounded-xl border border-wait-line px-3.5 text-left text-sm font-semibold text-wait'
  if (staff && booking.bookingRequestId)
    return (
      <Link to={`/requests/${booking.bookingRequestId}`} className={`${cls} transition-colors hover:border-wait-dot`}>
        {body}
      </Link>
    )
  return <div className={cls}>{body}</div>
}

function readContact(): { name: string; phone: string } {
  try {
    const raw = localStorage.getItem(CONTACT_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    if (parsed && typeof parsed.name === 'string' && typeof parsed.phone === 'string') return parsed
  } catch {
    return { name: '', phone: '' }
  }
  return { name: '', phone: '' }
}

function saveContact(name: string, phone: string) {
  try {
    localStorage.setItem(CONTACT_KEY, JSON.stringify({ name, phone }))
  } catch {
    return
  }
}

function RequestSheet({
  venue,
  date,
  selection,
  onClose,
  onTaken,
}: {
  venue: Venue
  date: string
  selection: Selection
  onClose: () => void
  onTaken: () => void
}) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [contact] = useState(readContact)
  const [name, setName] = useState(contact.name)
  const [phone, setPhone] = useState(formatPhoneInput(contact.phone))
  const [comment, setComment] = useState('')
  const [website, setWebsite] = useState('')
  const [phoneError, setPhoneError] = useState<string | null>(null)

  const end = selection.start + selection.count
  const total = venue.pricePerHour * selection.count
  const dateText = format(new Date(`${date}T00:00:00`), 'EEEEEE, d MMMM', { locale: dateLocale(i18n.language) })

  const mutation = useMutation({
    mutationFn: () =>
      createGuestRequest({
        venueId: venue.id,
        date,
        startTime: `${String(selection.start).padStart(2, '0')}:00:00`,
        hours: selection.count,
        clientName: name.trim(),
        clientPhone: `+998${phoneDigits(phone)}`,
        comment: comment.trim() || undefined,
        language: i18n.language === 'uz' ? 'uz' : 'ru',
        website,
      }),
    onSuccess: (res) => {
      saveContact(name.trim(), phoneDigits(phone))
      rememberRequest(res.token)
      navigate(`/r/${res.token}`)
    },
    onError: (err) => {
      const code = apiErrorCode(err)
      if (code === 'invalid_phone') {
        setPhoneError(t('guest.errors.invalid_phone'))
        return
      }
      const known = ['slot_taken', 'too_soon', 'phone_limit', 'outside_hours', 'rate_limited']
      toast.error(t(`guest.errors.${code && known.includes(code) ? code : 'generic'}`))
      if (code === 'slot_taken' || code === 'too_soon') onTaken()
    },
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (phoneDigits(phone).length !== 9) {
      setPhoneError(t('guest.errors.invalid_phone'))
      return
    }
    mutation.mutate()
  }

  return (
    <Sheet
      title={t('guest.formTitle')}
      onClose={onClose}
      footer={
        <Button type="submit" form="guest-request-form" size="lg" className="w-full" loading={mutation.isPending}>
          {t('guest.submit')}
        </Button>
      }
    >
      <form id="guest-request-form" onSubmit={submit} noValidate>
        <div className="rounded-2xl bg-sunken p-3.5">
          <div className="text-sm font-semibold text-ink">{venue.name}</div>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[22px] font-bold leading-none tracking-[-0.02em] text-ink tabular">
                {hourLabel(selection.start)}–{hourLabel(end)}
              </div>
              <div className="mt-1.5 text-sm text-ink-2">
                <span className="tabular">{dateText}</span> · {t('guest.hoursCount', { count: selection.count })}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-xs text-ink-3">{t('guest.sum')}</div>
              <div className="text-[17px] font-bold text-ink tabular">{formatMoney(total)}</div>
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <Field label={t('guest.yourName')} htmlFor="guest-name" required>
            <input
              id="guest-name"
              className={inputClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="given-name"
              maxLength={100}
              required
            />
          </Field>
          <Field
            label={t('guest.phone')}
            htmlFor="guest-phone"
            required
            hint={phoneError ? undefined : t('guest.phoneHint')}
          >
            <div
              className={`flex h-11 items-center rounded-xl border bg-surface transition-colors duration-150 focus-within:border-brand focus-within:ring-3 focus-within:ring-brand/15 ${
                phoneError ? 'border-due' : 'border-line-strong hover:border-ink-3'
              }`}
            >
              <span className="pl-3.5 text-[15px] text-ink tabular">+998</span>
              <input
                id="guest-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="90 123 45 67"
                className="h-full min-w-0 flex-1 rounded-r-xl bg-transparent pr-3.5 pl-1.5 text-[15px] text-ink tabular placeholder:text-ink-3 focus:outline-none"
                value={phone}
                onChange={(e) => {
                  setPhone(formatPhoneInput(e.target.value))
                  setPhoneError(null)
                }}
                aria-invalid={!!phoneError}
                aria-describedby={phoneError ? 'guest-phone-error' : undefined}
                required
              />
            </div>
            {phoneError && (
              <p id="guest-phone-error" className="mt-1.5 text-xs font-medium text-due">
                {phoneError}
              </p>
            )}
          </Field>
          <Field label={t('guest.comment')} htmlFor="guest-comment">
            <textarea
              id="guest-comment"
              className={textareaClass.replace('min-h-24', 'min-h-20')}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('guest.commentPlaceholder')}
              maxLength={500}
            />
          </Field>
          <input
            type="text"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
            className="absolute -left-[9999px] size-px opacity-0"
          />
        </div>

        <ul className="mt-5 space-y-2.5 text-sm text-ink-2">
          <li className="flex gap-2.5">
            <Clock3 className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
            <span>{t('guest.noteConfirm')}</span>
          </li>
          <li className="flex gap-2.5">
            <Wallet className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
            <span>{t('guest.notePayment')}</span>
          </li>
        </ul>
      </form>
    </Sheet>
  )
}

export default function VenueDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const loggedIn = useAuthStore((s) => s.isAuthenticated())
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selection, setSelection] = useState<Selection | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const now = useNow(60_000)

  const { data: venue, isLoading: venueLoading } = useQuery({
    queryKey: ['venue', id],
    queryFn: () => getVenue(id!),
  })

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['bookings', id, selectedDate],
    queryFn: () => getBookingsByVenueAndDate(id!, selectedDate),
    enabled: !!id,
    refetchInterval: loggedIn ? false : 60_000,
  })

  if (venueLoading)
    return (
      <div className="grid gap-5 lg:grid-cols-[minmax(0,360px)_1fr]" role="status" aria-label={t('common.loading')}>
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-[480px] rounded-2xl" />
      </div>
    )
  if (!venue)
    return (
      <EmptyState
        icon={<SearchX className="size-6" />}
        title={t('venues.notFound')}
        action={<Link to="/venues" className={buttonClass('secondary')}>{t('common.back')}</Link>}
      />
    )

  const openHour = parseInt(venue.openTime.substring(0, 2))
  const closeHour = parseInt(venue.closeTime.substring(0, 2))
  const hours = Array.from({ length: closeHour - openHour }, (_, i) => openHour + i)

  const slotTime = (hour: number) => new Date(`${selectedDate}T${String(hour).padStart(2, '0')}:00:00`).getTime()
  // A slot is in the past if its start (selectedDate + hour) is before now.
  const isPastHour = (hour: number) => slotTime(hour) < now
  const isSoonHour = (hour: number) => !isPastHour(hour) && slotTime(hour) - now < MIN_LEAD_MS

  const bookingByHour = new Map<number, Booking>()
  bookings.forEach((b) => {
    if (b.status === 'Active' || b.status === 'Pending') {
      const h = parseInt(b.startTime.substring(0, 2))
      bookingByHour.set(h, b)
    }
  })

  const freeCount = hours.filter((h) => !bookingByHour.has(h) && !isPastHour(h)).length
  const inSelection = (h: number) => !!selection && h >= selection.start && h < selection.start + selection.count

  const toggleHour = (h: number) => {
    if (!selection) return setSelection({ start: h, count: 1 })
    const end = selection.start + selection.count
    if (inSelection(h)) {
      if (selection.count === 1) return setSelection(null)
      if (h === selection.start) return setSelection({ start: h + 1, count: selection.count - 1 })
      if (h === end - 1) return setSelection({ start: selection.start, count: selection.count - 1 })
      return setSelection({ start: h, count: 1 })
    }
    const adjacent = h === selection.start - 1 || h === end
    if (adjacent && selection.count >= MAX_HOURS) {
      toast(t('guest.maxHours'))
      return
    }
    if (adjacent) return setSelection({ start: Math.min(h, selection.start), count: selection.count + 1 })
    setSelection({ start: h, count: 1 })
  }

  const changeDate = (d: string) => {
    setSelectedDate(d)
    setSelection(null)
  }

  const onTaken = () => {
    setFormOpen(false)
    setSelection(null)
    queryClient.invalidateQueries({ queryKey: ['bookings', id, selectedDate] })
  }

  const selectionSummary = selection && (
    <div className="min-w-0 flex-1">
      <div className="text-[15px] font-bold text-ink tabular">
        {hourLabel(selection.start)}–{hourLabel(selection.start + selection.count)} ·{' '}
        {t('guest.hoursShort', { count: selection.count })}
      </div>
      <div className="text-sm text-ink-2 tabular">
        {formatMoney(venue.pricePerHour * selection.count)} {t('dashboard.som')}
      </div>
    </div>
  )

  const renderGuestSlot = (hour: number, booking: Booking | undefined, past: boolean) => {
    if (booking?.status === 'Pending') return <PendingSlot booking={booking} staff={false} />
    if (booking)
      return (
        <div className="flex min-h-12 items-center rounded-xl bg-sunken px-3.5 text-sm font-semibold text-ink-3">
          {t('bookings.booked')}
        </div>
      )
    if (past)
      return <div className="flex min-h-12 items-center px-3.5 text-sm text-ink-3/70">{t('bookings.past')}</div>
    if (isSoonHour(hour))
      return (
        <a
          href={phoneLink(venue.phone)}
          className="flex min-h-12 items-center justify-between rounded-xl border border-line px-3.5 text-sm transition-colors hover:border-line-strong hover:bg-sunken"
        >
          <span className="text-ink-2">{t('guest.soon')}</span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-brand">
            <Phone className="size-3.5" aria-hidden />
            {t('guest.byCall')}
          </span>
        </a>
      )
    const on = inSelection(hour)
    if (on) {
      const first = hour === selection!.start
      const last = hour === selection!.start + selection!.count - 1
      return (
        <button
          type="button"
          aria-pressed
          onClick={() => toggleHour(hour)}
          className={`flex min-h-12 w-full items-center justify-between bg-brand px-3.5 text-left text-white transition-colors duration-150 hover:bg-brand-hover ${
            first ? 'rounded-t-xl' : 'border-t border-white/25'
          } ${last ? 'rounded-b-xl' : ''}`}
        >
          <span className="text-sm font-semibold">{t('guest.selected')}</span>
          <Check className="size-4.5" aria-hidden />
        </button>
      )
    }
    return (
      <button
        type="button"
        aria-pressed={false}
        onClick={() => toggleHour(hour)}
        className="flex min-h-12 w-full items-center justify-between rounded-xl border border-dashed border-brand/40 bg-brand-soft/60 px-3.5 text-left text-sm font-semibold text-brand-ink transition-colors duration-150 hover:border-brand hover:bg-brand-soft"
      >
        <span>{t('bookings.free')}</span>
        <Plus className="size-4" aria-hidden />
      </button>
    )
  }

  const renderStaffSlot = (hour: number, booking: Booking | undefined, past: boolean) => {
    if (booking?.status === 'Pending') return <PendingSlot booking={booking} staff />
    if (booking) return <BookedSlot booking={booking} />
    if (past)
      return <div className="flex min-h-12 items-center px-3.5 text-sm text-ink-3/70">{t('bookings.past')}</div>
    return (
      <button
        type="button"
        onClick={() => navigate(`/bookings/new?venueId=${id}&date=${selectedDate}&hour=${hour}`)}
        className="group flex min-h-12 w-full items-center justify-between rounded-xl border border-dashed border-line-strong px-3.5 text-left transition-colors duration-150 hover:border-brand hover:bg-brand-soft"
      >
        <span className="text-sm font-medium text-ink-2">{t('bookings.free')}</span>
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand">
          <Plus className="size-4" />
          {t('bookings.book')}
        </span>
      </button>
    )
  }

  return (
    <div className={loggedIn ? '' : 'pb-24 lg:pb-0'}>
      <Link
        to="/venues"
        className="-ml-2 mb-3 inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
      >
        <ArrowLeft className="size-4" />
        {t('nav.venues')}
      </Link>

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-7">
        <Card className="overflow-hidden lg:sticky lg:top-9">
          <div className="aspect-[16/9] bg-sunken">
            <img
              src={venue.imageUrl || '/venue-placeholder.svg'}
              onError={(e) => { e.currentTarget.src = '/venue-placeholder.svg' }}
              alt={venue.name}
              className="size-full object-cover"
            />
          </div>
          <div className="p-4 lg:p-5">
            <h1 className="text-[22px] font-bold leading-tight tracking-[-0.02em] text-ink">{venue.name}</h1>
            <div className="mt-1.5 flex items-start gap-1.5 text-sm text-ink-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-ink-3" />
              {venue.address}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-sunken px-3 py-2.5">
                <div className="text-xs text-ink-3">{t('venues.price')}</div>
                <div className="mt-0.5 font-bold text-ink tabular">
                  {formatMoney(venue.pricePerHour)}{' '}
                  <span className="text-sm font-medium text-ink-3">{t('venues.pricePerHour')}</span>
                </div>
              </div>
              <div className="rounded-xl bg-sunken px-3 py-2.5">
                <div className="text-xs text-ink-3">{t('venues.workingHours')}</div>
                <div className="mt-0.5 flex items-center gap-1.5 font-bold text-ink tabular">
                  <Clock className="size-3.5 text-ink-3" />
                  {hhmm(venue.openTime)}–{hhmm(venue.closeTime)}
                </div>
              </div>
            </div>
            {venue.description && <p className="mt-4 text-sm leading-relaxed text-ink-2">{venue.description}</p>}
            <a href={phoneLink(venue.phone)} className={buttonClass('secondary', 'md', 'mt-4 w-full')}>
              <Phone className="size-4" />
              <span className="tabular">{venue.phone}</span>
            </a>
          </div>
        </Card>

        <Card className="p-4 lg:p-5">
          <div className="mb-4 flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-bold tracking-[-0.01em] text-ink">
              {loggedIn ? t('schedule.title') : t('guest.pickTime')}
            </h2>
            <span className="text-sm text-ink-3">
              {loggedIn ? t('schedule.freeOf', { free: freeCount, total: hours.length }) : t('guest.upTo3')}
            </span>
          </div>

          <div className="mb-4">
            <DateStrip value={selectedDate} onChange={changeDate} />
          </div>

          {loggedIn ? (
            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-ink-3">
              {(['FullyPaid', 'Prepaid', 'Unpaid'] as PaymentStatus[]).map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${paymentDotClass(s)}`} />
                  {t(`bookings.paymentStatuses.${s.toLowerCase()}`)}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5">
                <span className="hatch size-2.5 rounded-[3px] border border-wait-line" />
                {t('guest.pending')}
              </span>
            </div>
          ) : (
            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-ink-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-[3px] border border-dashed border-brand/50 bg-brand-soft" />
                {t('bookings.free')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="hatch size-2.5 rounded-[3px] border border-wait-line" />
                {t('guest.pending')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-[3px] bg-line" />
                {t('bookings.booked')}
              </span>
            </div>
          )}

          {bookingsLoading ? (
            <div className="space-y-1.5" role="status" aria-label={t('common.loading')}>
              {hours.slice(0, 8).map((h) => (
                <Skeleton key={h} className="h-12" />
              ))}
            </div>
          ) : (
            <ol className={loggedIn ? 'divide-y divide-line' : ''}>
              {hours.map((hour) => {
                const booking = bookingByHour.get(hour)
                const past = isPastHour(hour)
                const on = !loggedIn && inSelection(hour)
                const joinedTop = on && hour !== selection!.start
                const joinedBottom = on && hour !== selection!.start + selection!.count - 1
                return (
                  <li
                    key={hour}
                    className={`flex items-start gap-3 ${joinedTop ? '' : 'pt-1.5'} ${joinedBottom ? '' : 'pb-1.5'}`}
                  >
                    <div className={`w-14 shrink-0 pt-3 tabular ${past && !booking ? 'opacity-50' : ''}`}>
                      <div className="text-[15px] font-bold leading-none text-ink">{hourLabel(hour)}</div>
                      <div className="mt-1 text-[11px] leading-none text-ink-3">{hourLabel(hour + 1)}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      {loggedIn ? renderStaffSlot(hour, booking, past) : renderGuestSlot(hour, booking, past)}
                    </div>
                  </li>
                )
              })}
            </ol>
          )}

          {!loggedIn && selection && (
            <div className="sticky bottom-0 -mx-4 mt-3 -mb-4 hidden items-center gap-3 rounded-b-2xl border-t border-line bg-surface/95 px-4 py-3 backdrop-blur-sm lg:-mx-5 lg:-mb-5 lg:flex lg:px-5">
              {selectionSummary}
              <Button size="lg" onClick={() => setFormOpen(true)}>
                {t('guest.continue')}
                <ArrowRight className="size-4.5" />
              </Button>
            </div>
          )}
        </Card>
      </div>

      {!loggedIn && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:hidden">
          {selection ? (
            <div className="flex items-center gap-3">
              {selectionSummary}
              <Button size="lg" onClick={() => setFormOpen(true)}>
                {t('guest.continue')}
                <ArrowRight className="size-4.5" />
              </Button>
            </div>
          ) : (
            <a href={phoneLink(venue.phone)} className={buttonClass('secondary', 'lg', 'w-full')}>
              <Phone className="size-4" />
              {t('bookings.callToBookShort')}
            </a>
          )}
        </div>
      )}

      {formOpen && selection && (
        <RequestSheet
          venue={venue}
          date={selectedDate}
          selection={selection}
          onClose={() => setFormOpen(false)}
          onTaken={onTaken}
        />
      )}
    </div>
  )
}
