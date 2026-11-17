import { useEffect, useRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Loader2, X } from 'lucide-react'
import type { Booking, PaymentStatus } from '../types'
import { buttonClass, paymentTone } from './styles'
import type { Size, Variant } from './styles'
import { formatMoney, paidAmount, remainingAmount } from '../utils/format'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={buttonClass(variant, size, className)}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  )
}

export function IconButton({
  label,
  className = '',
  tone = 'neutral',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: 'neutral' | 'danger' }) {
  const toneClass =
    tone === 'danger'
      ? 'text-ink-3 hover:text-due hover:bg-due-soft'
      : 'text-ink-3 hover:text-ink hover:bg-sunken'
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex size-10 items-center justify-center rounded-xl transition-colors duration-150 disabled:opacity-40 ${toneClass} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`rounded-2xl border border-line bg-surface ${className}`}>{children}</div>
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 lg:mb-7">
      <div className="min-w-0">
        <h1 className="text-[22px] font-bold leading-tight tracking-[-0.02em] text-ink lg:text-[26px]">
          {title}
        </h1>
        {description && <p className="mt-1 text-sm text-ink-3">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function PaymentBadge({ status, className = '' }: { status: PaymentStatus; className?: string }) {
  const { t } = useTranslation()
  const tone = paymentTone[status]
  return (
    <span
      className={`inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold ${tone.box} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${tone.dot}`} aria-hidden />
      {t(`bookings.paymentStatuses.${status.toLowerCase()}`)}
    </span>
  )
}

export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'danger' }) {
  const cls = tone === 'danger' ? 'bg-due-soft text-due' : 'bg-sunken text-ink-2'
  return (
    <span className={`inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  )
}

export function MoneyLine({ booking, className = '' }: { booking: Booking; className?: string }) {
  const { t } = useTranslation()
  const paid = paidAmount(booking)
  const left = remainingAmount(booking)
  return (
    <dl className={`grid grid-cols-3 gap-2 text-sm tabular ${className}`}>
      <div>
        <dt className="text-xs text-ink-3">{t('bookings.total')}</dt>
        <dd className="font-semibold text-ink">{formatMoney(booking.totalAmount)}</dd>
      </div>
      <div>
        <dt className="text-xs text-ink-3">{t('bookings.paid')}</dt>
        <dd className={`font-semibold ${paid > 0 ? 'text-paid' : 'text-ink-3'}`}>{formatMoney(paid)}</dd>
      </div>
      <div>
        <dt className="text-xs text-ink-3">{t('bookings.remaining')}</dt>
        <dd className={`font-semibold ${left > 0 ? 'text-due' : 'text-ink-3'}`}>{formatMoney(left)}</dd>
      </div>
    </dl>
  )
}

export const inputClass =
  'block w-full h-11 rounded-xl border border-line-strong bg-surface px-3.5 text-[15px] text-ink placeholder:text-ink-3 transition-colors duration-150 hover:border-ink-3 focus:border-brand focus:outline-none focus:ring-3 focus:ring-brand/15 disabled:bg-sunken disabled:text-ink-3'

export const textareaClass = inputClass.replace('h-11', 'min-h-24 py-2.5') + ' resize-none'

export function Field({
  label,
  hint,
  htmlFor,
  required,
  children,
}: {
  label: ReactNode
  hint?: ReactNode
  htmlFor?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink-2">
        {label}
        {required && <span className="ml-0.5 text-due">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-ink-3">{hint}</p>}
    </div>
  )
}

export function Segmented<T extends string | number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: ReactNode }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex rounded-xl bg-sunken p-1">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={String(o.value)}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
              on ? 'bg-surface text-ink shadow-raise' : 'text-ink-3 hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode
  title: ReactNode
  text?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-sunken text-ink-3">
        {icon}
      </div>
      <p className="font-semibold text-ink">{title}</p>
      {text && <p className="mt-1 max-w-xs text-sm text-ink-3">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`rounded-xl bg-[linear-gradient(90deg,var(--color-sunken)_25%,var(--color-line)_50%,var(--color-sunken)_75%)] bg-size-[200%_100%] animate-[shimmer_1.4s_linear_infinite] ${className}`}
    />
  )
}

export function ListSkeleton({ rows = 5, className = 'h-20' }: { rows?: number; className?: string }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-3" role="status" aria-label={t('common.loading')}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className={className} />
      ))}
    </div>
  )
}

export function Sheet({
  title,
  onClose,
  children,
  footer,
}: {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}) {
  const { t } = useTranslation()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const prevFocus = document.activeElement as HTMLElement | null
    const first = panelRef.current?.querySelector<HTMLElement>(
      'input:not([type=hidden]):not([type=radio]),select,textarea,button[data-autofocus]'
    )
    first?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', onKey)
      prevFocus?.focus?.({ preventScroll: true })
    }
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 bg-ink/40 animate-[fade-in_150ms_ease-out]"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className="relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-surface shadow-float animate-[sheet-in_220ms_var(--ease-out)] sm:max-w-md sm:rounded-3xl"
      >
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-line-strong sm:hidden" aria-hidden />
        <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-2 sm:pt-5">
          <h2 className="text-lg font-bold tracking-[-0.01em] text-ink">{title}</h2>
          <IconButton label={t('common.close')} onClick={onClose} className="-mr-2">
            <X className="size-5" />
          </IconButton>
        </div>
        <div className="overflow-y-auto px-5 pb-5">{children}</div>
        {footer && (
          <div className="flex gap-3 border-t border-line px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
