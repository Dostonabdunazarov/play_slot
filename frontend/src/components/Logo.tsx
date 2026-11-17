export default function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="9" fill="var(--color-brand)" />
        <rect x="7" y="9" width="18" height="14" rx="2" fill="none" stroke="#fff" strokeWidth="1.8" />
        <line x1="16" y1="9" x2="16" y2="23" stroke="#fff" strokeWidth="1.8" />
        <circle cx="16" cy="16" r="3" fill="none" stroke="#fff" strokeWidth="1.8" />
      </svg>
      <span className="text-[17px] font-bold tracking-[-0.02em] text-ink">BronSlot</span>
    </span>
  )
}
