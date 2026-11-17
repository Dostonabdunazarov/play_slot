import NeonBall from './NeonBall'

export function LogoMark({ className = 'size-9' }: { className?: string }) {
  return (
    <span aria-hidden className={`relative inline-block shrink-0 ${className}`}>
      <NeonBall
        className="pointer-events-none absolute"
        style={{ left: '-32.5%', top: '-32.5%', width: '165%', height: '165%' }}
      />
    </span>
  )
}

export default function Logo({ className = '', dark = false }: { className?: string; dark?: boolean }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className={`text-[1.0625rem] leading-none font-bold tracking-[-0.02em] ${dark ? 'text-white' : 'text-ink'}`}>Futsal</span>
    </span>
  )
}
