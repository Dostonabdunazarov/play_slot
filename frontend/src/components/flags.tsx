export function FlagRu({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden>
      <rect width="30" height="20" fill="#fff" />
      <rect y="6.67" width="30" height="6.67" fill="#0039a6" />
      <rect y="13.33" width="30" height="6.67" fill="#d52b1e" />
    </svg>
  )
}

export function FlagUz({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden>
      <rect width="30" height="20" fill="#fff" />
      <rect width="30" height="6.4" fill="#0099b5" />
      <rect y="13.6" width="30" height="6.4" fill="#1eb53a" />
      <rect y="6.4" width="30" height="0.6" fill="#ce1126" />
      <rect y="13" width="30" height="0.6" fill="#ce1126" />
      <circle cx="4.6" cy="3.2" r="2.2" fill="#fff" />
      <circle cx="5.5" cy="3.2" r="1.9" fill="#0099b5" />
      <circle cx="8.6" cy="1.6" r="0.45" fill="#fff" />
      <circle cx="10.2" cy="1.6" r="0.45" fill="#fff" />
      <circle cx="11.8" cy="1.6" r="0.45" fill="#fff" />
      <circle cx="8.6" cy="3.2" r="0.45" fill="#fff" />
      <circle cx="10.2" cy="3.2" r="0.45" fill="#fff" />
      <circle cx="11.8" cy="3.2" r="0.45" fill="#fff" />
      <circle cx="10.2" cy="4.8" r="0.45" fill="#fff" />
      <circle cx="11.8" cy="4.8" r="0.45" fill="#fff" />
    </svg>
  )
}
