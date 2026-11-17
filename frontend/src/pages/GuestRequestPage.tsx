import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { ArrowLeft, Check, Copy, Info, Phone, SearchX, Send, X } from 'lucide-react'
import { cancelGuestRequest, getGuestRequest } from '../api/bookingRequests'
import { Button, Card, EmptyState, Sheet, Skeleton } from '../components/ui'
import { buttonClass } from '../components/styles'
import { RequestStatusPill } from '../components/requests'
import { clockTime, dayLabel, reasonLabel, timeRange, useNow } from '../utils/requestFormat'
import { formatMoney, phoneLink } from '../utils/format'
import { minutesLeft } from '../utils/guestRequests'
import type { GuestRequest } from '../types'

type StepState = 'done' | 'current' | 'todo' | 'failed'

function Step({ state, title, hint, last }: { state: StepState; title: string; hint?: string; last?: boolean }) {
  const marker =
    state === 'done' ? (
      <span className="flex size-6 items-center justify-center rounded-full bg-brand text-white">
        <Check className="size-3.5" strokeWidth={3} />
      </span>
    ) : state === 'current' ? (
      <span className="flex size-6 items-center justify-center rounded-full border-2 border-wait-dot bg-wait-soft">
        <span className="size-2 rounded-full bg-wait-dot" />
      </span>
    ) : state === 'failed' ? (
      <span className="flex size-6 items-center justify-center rounded-full bg-due text-white">
        <X className="size-3.5" strokeWidth={3} />
      </span>
    ) : (
      <span className="size-6 rounded-full border-2 border-line-strong" />
    )
  return (
    <li className="flex gap-3">
      <div className="flex flex-col items-center">
        {marker}
        {!last && <span className={`my-1 w-px flex-1 ${state === 'done' ? 'bg-brand' : 'bg-line'}`} />}
      </div>
      <div className={last ? '' : 'pb-4'}>
        <div className={`text-[0.9375rem] font-semibold ${state === 'todo' ? 'text-ink-3' : 'text-ink'}`}>{title}</div>
        {hint && <div className="text-sm text-ink-3 tabular">{hint}</div>}
      </div>
    </li>
  )
}

function Timeline({ r, now }: { r: GuestRequest; now: number }) {
  const { t } = useTranslation()
  const sent = <Step state="done" title={t('guest.stepSent')} hint={clockTime(r.createdAt)} />
  if (r.status === 'Pending')
    return (
      <ol>
        {sent}
        <Step
          state="current"
          title={t('guest.stepReview')}
          hint={t('requests.minLeftLong', { count: minutesLeft(r.expiresAt, now) })}
        />
        <Step state="todo" title={t('guest.stepConfirmed')} hint={t('guest.stepConfirmedHint')} last />
      </ol>
    )
  const decided = r.decidedAt ? clockTime(r.decidedAt) : undefined
  return (
    <ol>
      {sent}
      <Step state="done" title={t('guest.stepReview')} />
      {r.status === 'Approved' ? (
        <Step state="done" title={t('guest.stepConfirmed')} hint={decided} last />
      ) : (
        <Step
          state="failed"
          title={t(
            r.status === 'Rejected'
              ? 'guest.stepRejected'
              : r.status === 'Expired'
                ? 'guest.stepExpired'
                : 'guest.stepCancelled'
          )}
          hint={decided}
          last
        />
      )}
    </ol>
  )
}

function CopyRow({ value }: { value: string }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success(t('guest.copied'))
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t('common.error'))
    }
  }
  return (
    <div className="flex items-start gap-3 rounded-xl bg-sunken px-3.5 py-3">
      <p className="min-w-0 flex-1 whitespace-pre-line break-words text-[0.9375rem] font-semibold leading-snug text-ink tabular">
        {value}
      </p>
      <button
        type="button"
        onClick={copy}
        className={buttonClass('secondary', 'sm', 'shrink-0')}
        aria-label={t('guest.copy')}
      >
        {copied ? <Check className="size-4 text-accent" /> : <Copy className="size-4" />}
        <span className="hidden sm:inline">{t('guest.copy')}</span>
      </button>
    </div>
  )
}

export default function GuestRequestPage() {
  const { token = '' } = useParams<{ token: string }>()
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const now = useNow(15_000)
  const [confirmCancel, setConfirmCancel] = useState(false)

  const { data: r, isLoading, isError } = useQuery({
    queryKey: ['guest-request', token],
    queryFn: () => getGuestRequest(token),
    retry: false,
    refetchInterval: (q) => (q.state.data?.status === 'Pending' ? 20_000 : false),
    refetchOnWindowFocus: true,
  })

  const cancel = useMutation({
    mutationFn: () => cancelGuestRequest(token),
    onSuccess: (data) => {
      queryClient.setQueryData(['guest-request', token], data)
      queryClient.invalidateQueries({ queryKey: ['guest-requests'] })
      setConfirmCancel(false)
      toast.success(t('guest.cancelled'))
    },
    onError: () => {
      setConfirmCancel(false)
      queryClient.invalidateQueries({ queryKey: ['guest-request', token] })
      toast.error(t('common.error'))
    },
  })

  const back = (
    <div>
      <Link
        to="/my-requests"
        className="-ml-2 mb-3 inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
    >
        <ArrowLeft className="size-4" />
        {t('guest.myRequests')}
      </Link>
    </div>
  )

  if (isLoading)
    return (
      <div className="mx-auto max-w-lg space-y-3" role="status" aria-label={t('common.loading')}>
        <Skeleton className="h-24" />
        <Skeleton className="h-40" />
        <Skeleton className="h-28" />
      </div>
    )

  if (isError || !r)
    return (
      <EmptyState
        icon={<SearchX className="size-6" />}
        title={t('requests.notFound')}
        text={t('guest.notFoundText')}
        action={
          <Link to="/venues" className={buttonClass('secondary')}>
            {t('guest.pickVenue')}
          </Link>
        }
      />
    )

  const lang = i18n.language
  const when = `${dayLabel(r.date, t, lang)}, ${timeRange(r.startTime, r.endTime)}`
  const reason = reasonLabel(r.rejectReason, t)

  const heading = {
    Pending: { title: t('guest.sentTitle'), text: t('guest.sentText', { time: clockTime(r.expiresAt) }) },
    Approved: { title: t('guest.approvedTitle'), text: t('guest.approvedText', { when, venue: r.venueName }) },
    Rejected: { title: t('guest.rejectedTitle'), text: t('guest.rejectedText') },
    Expired: { title: t('guest.expiredTitle'), text: t('guest.expiredText') },
    CancelledByGuest: { title: t('guest.cancelledTitle'), text: t('guest.cancelledText') },
  }[r.status]

  const details = (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to={`/venues/${r.venueId}`} className="text-[0.9375rem] font-semibold text-ink hover:underline">
            {r.venueName}
          </Link>
          {r.venueAddress && <div className="mt-0.5 text-sm text-ink-2">{r.venueAddress}</div>}
        </div>
        {r.venuePhone && (
          <a
            href={phoneLink(r.venuePhone)}
            aria-label={t('guest.call')}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-line-strong text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
          >
            <Phone className="size-4.5" />
          </a>
        )}
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-sm tabular">
        <div>
          <dt className="text-xs text-ink-3">{t('guest.date')}</dt>
          <dd className="font-semibold text-ink">{dayLabel(r.date, t, lang)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-3">{t('guest.time')}</dt>
          <dd className="font-semibold text-ink">{timeRange(r.startTime, r.endTime)}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-3">{t('guest.sum')}</dt>
          <dd className="font-semibold text-ink">{formatMoney(r.totalAmount)}</dd>
        </div>
      </dl>
    </Card>
  )

  return (
    <div className="mx-auto max-w-lg">
      {back}

      <RequestStatusPill status={r.status} />
      <h1 className="mt-3 text-[1.5rem] font-bold leading-tight tracking-[-0.02em] text-ink">{heading.title}</h1>
      <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-ink-2">{heading.text}</p>
      {reason && r.status === 'Rejected' && (
        <p className="mt-2 text-[0.9375rem] font-medium text-due">{t('guest.reason', { reason })}</p>
      )}

      <div className="mt-5 space-y-3">
        {r.status === 'Approved' && (
          <Card className="p-4">
            {r.prepaymentAmount ? (
              <>
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-[0.9375rem] font-semibold text-ink">{t('guest.prepaymentTitle')}</div>
                  <div className="text-[1.25rem] font-bold tracking-[-0.01em] text-ink tabular">
                    {formatMoney(r.prepaymentAmount)} {t('dashboard.som')}
                  </div>
                </div>
                <p className="mt-1 text-sm text-ink-2">
                  {t('guest.prepaymentFixedOf', { total: formatMoney(r.totalAmount) })}
                </p>
              </>
            ) : (
              <>
                <div className="text-[0.9375rem] font-semibold text-ink">{t('guest.paymentTitle')}</div>
                <p className="mt-1 text-sm text-ink-2">
                  {t('guest.payOnSiteText', { total: formatMoney(r.totalAmount) })}
                </p>
              </>
            )}
            {r.paymentDetails && (
              <div className="mt-4">
                <div className="mb-2 text-sm font-medium text-ink-2">{t('guest.paymentDetails')}</div>
                <CopyRow value={r.paymentDetails} />
                <p className="mt-3 flex gap-2 text-sm text-ink-2">
                  <Info className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
                  {t('guest.paymentNote')}
                </p>
              </div>
            )}
          </Card>
        )}

        {r.status === 'Pending' && (
          <Card className="px-4 py-3.5">
            <Timeline r={r} now={now} />
          </Card>
        )}

        {details}

        {r.status !== 'Pending' && r.status !== 'Approved' && (
          <Card className="px-4 py-3.5">
            <Timeline r={r} now={now} />
          </Card>
        )}

        {r.telegramUrl && (
          <div className="rounded-2xl bg-tg-soft p-4">
            <div className="flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-tg text-white">
                <Send className="size-4.5" />
              </span>
              <div className="min-w-0">
                <div className="text-[0.9375rem] font-semibold text-ink">{t('guest.tgTitle')}</div>
                <div className="mt-0.5 text-sm text-ink-2">{t('guest.tgText')}</div>
              </div>
            </div>
            <a
              href={r.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-tg text-[0.9375rem] font-semibold text-white transition-colors hover:bg-tg-hover"
            >
              {t('guest.tgButton')}
            </a>
          </div>
        )}
        {r.telegramLinked && (
          <p className="flex items-center justify-center gap-1.5 text-sm text-ink-3">
            <Send className="size-3.5" aria-hidden />
            {t('guest.tgLinked')}
          </p>
        )}

        {(r.status === 'Rejected' || r.status === 'Expired' || r.status === 'CancelledByGuest') && (
          <Link to={`/venues/${r.venueId}`} className={buttonClass('primary', 'lg', 'w-full')}>
            {t('guest.otherTime')}
          </Link>
        )}

        {r.status === 'Pending' && (
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            className="flex h-11 w-full items-center justify-center rounded-xl text-[0.9375rem] font-semibold text-due transition-colors hover:bg-due-soft"
          >
            {t('guest.cancel')}
          </button>
        )}
      </div>

      {confirmCancel && (
        <Sheet
          title={t('guest.cancel')}
          onClose={() => setConfirmCancel(false)}
          footer={
            <>
              <Button variant="secondary" size="lg" className="flex-1" onClick={() => setConfirmCancel(false)}>
                {t('common.back')}
              </Button>
              <Button
                size="lg"
                className="flex-1 bg-due! hover:bg-due/90!"
                loading={cancel.isPending}
                onClick={() => cancel.mutate()}
                data-autofocus
              >
                {t('guest.cancel')}
              </Button>
            </>
          }
        >
          <p className="text-[0.9375rem] text-ink-2">
            {when}, {r.venueName}. {t('guest.cancelConfirm')}
          </p>
        </Sheet>
      )}
    </div>
  )
}
