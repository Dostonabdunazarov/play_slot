export default function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img src="/logo-mark.svg" alt="" aria-hidden className="size-9 shrink-0" width={36} height={36} />
      <span className="text-[17px] font-bold tracking-[-0.02em] text-ink">Futsal</span>
    </span>
  )
}
