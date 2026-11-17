import type { PaymentStatus } from '../types'

export type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type Size = 'sm' | 'md' | 'lg'

const variantClass: Record<Variant, string> = {
  primary:
    'bg-brand text-white hover:bg-brand-hover active:bg-brand-press disabled:bg-brand/50',
  secondary:
    'bg-surface text-ink border border-line-strong hover:bg-sunken active:bg-line disabled:text-ink-3',
  ghost: 'text-ink-2 hover:bg-sunken hover:text-ink active:bg-line disabled:text-ink-3',
  danger:
    'bg-surface text-due border border-due/30 hover:bg-due-soft hover:border-due/50 active:bg-due-soft disabled:opacity-50',
}

const sizeClass: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-4 text-[15px] gap-2 rounded-xl',
  lg: 'h-12 px-5 text-base gap-2 rounded-xl',
}

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', extra = '') {
  return `inline-flex items-center justify-center font-semibold whitespace-nowrap select-none transition-colors duration-150 disabled:cursor-not-allowed ${variantClass[variant]} ${sizeClass[size]} ${extra}`
}

export const paymentTone: Record<PaymentStatus, { box: string; dot: string }> = {
  FullyPaid: { box: 'bg-paid-soft text-paid', dot: 'bg-paid' },
  Prepaid: { box: 'bg-pre-soft text-pre', dot: 'bg-pre-dot' },
  Unpaid: { box: 'bg-due-soft text-due', dot: 'bg-due' },
}

export function paymentDotClass(status: PaymentStatus) {
  return paymentTone[status].dot
}
