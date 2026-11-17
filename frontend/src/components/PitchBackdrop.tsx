import type { ComponentType, ReactNode, SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { strokeWidth?: number }

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      {children}
    </svg>
  )
}

const BALL_PATCHES = 'M17.6 10.6L17.3 10.1L16.9 9.6L16.5 9.1L16.1 8.6L15.6 8.1L15.2 7.6L14.6 7.8L14.1 8.0L13.5 8.2L12.9 8.5L12.3 8.7L11.7 9.0L11.8 9.6L11.8 10.2L11.9 10.9L11.9 11.5L12.0 12.2L12.0 12.8L12.6 13.0L13.3 13.2L13.9 13.4L14.5 13.5L15.1 13.7L15.7 13.8L16.0 13.3L16.4 12.8L16.7 12.2L17.0 11.7L17.3 11.2ZM18.0 4.9L17.7 4.6L17.5 4.3L17.2 4.0L16.9 3.8L16.6 3.6L16.3 3.4L15.7 3.2L15.2 2.9L14.5 2.7L13.9 2.6L13.3 2.5L12.7 2.4L12.6 2.5L12.5 2.5L12.4 2.6L12.3 2.8L12.2 3.0L12.1 3.2L12.6 3.4L13.2 3.6L13.7 3.8L14.3 4.1L14.8 4.4L15.3 4.8L15.8 4.7L16.3 4.7L16.7 4.7L17.2 4.7L17.6 4.8ZM21.5 13.3L21.6 12.7L21.6 12.0L21.6 11.4L21.5 10.7L21.4 10.1L21.3 9.4L21.2 9.2L21.1 8.9L21.0 8.6L20.8 8.3L20.6 8.1L20.4 7.9L20.5 8.3L20.5 8.8L20.5 9.3L20.4 9.8L20.3 10.3L20.2 10.8L20.4 11.3L20.6 11.9L20.7 12.4L20.8 13.0L20.9 13.6L20.9 14.1L21.1 14.0L21.3 13.9L21.4 13.7L21.5 13.6L21.5 13.4ZM9.8 18.5L9.6 18.0L9.5 17.5L9.4 16.9L9.3 16.3L9.2 15.7L9.1 15.1L8.5 14.9L7.9 14.7L7.4 14.4L6.8 14.2L6.3 13.9L5.8 13.6L5.5 14.0L5.2 14.4L5.0 14.9L4.8 15.3L4.6 15.6L4.5 16.0L4.8 16.5L5.2 17.1L5.6 17.6L6.0 18.1L6.4 18.6L6.9 19.0L7.3 19.0L7.8 18.9L8.3 18.9L8.7 18.8L9.2 18.6ZM17.6 19.7L17.9 19.4L18.2 19.0L18.4 18.6L18.6 18.2L18.8 17.8L19.0 17.3L18.6 17.3L18.2 17.4L17.8 17.4L17.3 17.3L16.8 17.3L16.3 17.2L15.9 17.6L15.4 18.1L14.9 18.5L14.4 18.8L13.9 19.2L13.4 19.5L13.5 19.8L13.7 20.2L13.8 20.4L13.9 20.7L14.1 20.9L14.2 21.0L14.8 20.9L15.4 20.8L16.0 20.5L16.5 20.3L17.1 20.0ZM8.5 7.5L8.5 6.9L8.5 6.4L8.5 5.9L8.5 5.4L8.6 5.0L8.6 4.6L8.1 4.6L7.6 4.6L7.1 4.7L6.6 4.8L6.2 5.0L5.8 5.1L5.4 5.6L5.0 6.1L4.7 6.6L4.4 7.2L4.1 7.7L3.9 8.3L4.0 8.5L4.3 8.7L4.5 9.0L4.8 9.2L5.2 9.5L5.5 9.8L5.9 9.4L6.4 8.9L6.9 8.5L7.4 8.2L7.9 7.8Z'
const BALL_SEAMS = 'M17.6 10.6L17.3 10.1L16.9 9.6L16.5 9.1L16.1 8.6L15.6 8.1L15.2 7.6L14.6 7.8L14.1 8.0L13.5 8.2L12.9 8.5L12.3 8.7L11.7 9.0L11.8 9.6L11.8 10.2L11.9 10.9L11.9 11.5L12.0 12.2L12.0 12.8L12.6 13.0L13.3 13.2L13.9 13.4L14.5 13.5L15.1 13.7L15.7 13.8L16.0 13.3L16.4 12.8L16.7 12.2L17.0 11.7L17.3 11.2L17.6 10.6M18.0 4.9L17.7 4.6L17.5 4.3L17.2 4.0L16.9 3.8M12.6 2.5L12.5 2.5L12.4 2.6L12.3 2.8L12.2 3.0L12.1 3.2L12.6 3.4L13.2 3.6L13.7 3.8L14.3 4.1L14.8 4.4L15.3 4.8L15.8 4.7L16.3 4.7L16.7 4.7L17.2 4.7L17.6 4.8L18.0 4.9M21.0 8.6L20.8 8.3L20.6 8.1L20.4 7.9L20.5 8.3L20.5 8.8L20.5 9.3L20.4 9.8L20.3 10.3L20.2 10.8L20.4 11.3L20.6 11.9L20.7 12.4L20.8 13.0L20.9 13.6L20.9 14.1L21.1 14.0L21.3 13.9L21.4 13.7L21.5 13.6M9.8 18.5L9.6 18.0L9.5 17.5L9.4 16.9L9.3 16.3L9.2 15.7L9.1 15.1L8.5 14.9L7.9 14.7L7.4 14.4L6.8 14.2L6.3 13.9L5.8 13.6L5.5 14.0L5.2 14.4L5.0 14.9L4.8 15.3L4.6 15.6L4.5 16.0L4.8 16.5L5.2 17.1L5.6 17.6L6.0 18.1L6.4 18.6L6.9 19.0L7.3 19.0L7.8 18.9L8.3 18.9L8.7 18.8L9.2 18.6L9.8 18.5M17.6 19.7L17.9 19.4L18.2 19.0L18.4 18.6L18.6 18.2L18.8 17.8L19.0 17.3L18.6 17.3L18.2 17.4L17.8 17.4L17.3 17.3L16.8 17.3L16.3 17.2L15.9 17.6L15.4 18.1L14.9 18.5L14.4 18.8L13.9 19.2L13.4 19.5L13.5 19.8L13.7 20.2L13.8 20.4L13.9 20.7L14.1 20.9L14.2 21.0L14.8 20.9L15.4 20.8L16.0 20.5L16.5 20.3L17.1 20.0L17.6 19.7M8.5 7.5L8.5 6.9L8.5 6.4L8.5 5.9L8.5 5.4L8.6 5.0L8.6 4.6L8.1 4.6L7.6 4.6L7.1 4.7L6.6 4.8L6.2 5.0L5.8 5.1L5.4 5.6L5.0 6.1L4.7 6.6L4.4 7.2L4.1 7.7L3.9 8.3L4.0 8.5L4.3 8.7L4.5 9.0L4.8 9.2L5.2 9.5L5.5 9.8L5.9 9.4L6.4 8.9L6.9 8.5L7.4 8.2L7.9 7.8L8.5 7.5M9.5 21.3L8.8 21.1L8.3 20.8L7.7 20.6M2.9 14.8L2.8 14.5L2.7 13.9L2.6 13.3L2.5 12.6L2.4 12.0L2.5 11.3L2.5 10.7M11.8 21.6L12.3 21.6L12.8 21.5L13.2 21.4L13.7 21.2L14.2 21.0L14.1 20.9L13.9 20.7L13.8 20.4L13.7 20.2L13.5 19.8L13.4 19.5L12.8 19.4L12.2 19.3L11.6 19.1L10.9 18.9L10.3 18.7L9.8 18.5L9.2 18.6L8.7 18.8L8.3 18.9L7.8 18.9L7.3 19.0L6.9 19.0L7.0 19.3L7.1 19.7L7.2 19.9L7.3 20.2L7.5 20.4L7.7 20.6L8.3 20.8L8.8 21.1L9.5 21.3M5.8 5.1L5.8 4.9L5.9 4.7L6.0 4.6M2.5 10.7L2.6 10.3L2.8 9.9L3.0 9.5L3.3 9.1L3.5 8.7L3.9 8.3L4.1 7.7L4.4 7.2L4.7 6.6L5.0 6.1L5.4 5.6L5.8 5.1M12.0 12.8L12.0 12.2L11.9 11.5L11.9 10.9L11.8 10.2L11.8 9.6L11.7 9.0L11.2 8.7L10.6 8.4L10.1 8.1L9.5 7.9L9.0 7.7L8.5 7.5L7.9 7.8L7.4 8.2L6.9 8.5L6.4 8.9L5.9 9.4L5.5 9.8L5.5 10.4L5.5 11.0L5.5 11.7L5.6 12.3L5.7 13.0L5.8 13.6L6.3 13.9L6.8 14.2L7.4 14.4L7.9 14.7L8.5 14.9L9.1 15.1L9.5 14.8L10.0 14.4L10.5 14.0L11.0 13.6L11.5 13.2L12.0 12.8M21.5 13.6L21.4 13.7L21.3 13.9L21.1 14.0L20.9 14.1L20.7 14.7L20.4 15.2L20.1 15.8L19.7 16.3L19.4 16.8L19.0 17.3L18.8 17.8L18.6 18.2L18.4 18.6L18.2 19.0L17.9 19.4L17.6 19.7L17.8 19.6M20.2 10.8L20.3 10.3L20.4 9.8L20.5 9.3L20.5 8.8L20.5 8.3L20.4 7.9L20.1 7.3L19.7 6.8L19.3 6.3L18.9 5.8L18.4 5.3L18.0 4.9L17.6 4.8L17.2 4.7L16.7 4.7L16.3 4.7L15.8 4.7L15.3 4.8L15.4 5.2L15.3 5.6L15.3 6.1L15.3 6.6L15.2 7.1L15.2 7.6L15.6 8.1L16.1 8.6L16.5 9.1L16.9 9.6L17.3 10.1L17.6 10.6L18.1 10.6L18.6 10.7L19.1 10.7L19.5 10.7L19.9 10.7L20.2 10.8M15.2 7.6L15.2 7.1L15.3 6.6L15.3 6.1L15.3 5.6L15.4 5.2L15.3 4.8L14.8 4.4L14.3 4.1L13.7 3.8L13.2 3.6L12.6 3.4L12.1 3.2L11.5 3.4L10.9 3.5L10.3 3.7L9.7 4.0L9.2 4.3L8.6 4.6L8.6 5.0L8.5 5.4L8.5 5.9L8.5 6.4L8.5 6.9L8.5 7.5L9.0 7.7L9.5 7.9L10.1 8.1L10.6 8.4L11.2 8.7L11.7 9.0L12.3 8.7L12.9 8.5L13.5 8.2L14.1 8.0L14.6 7.8L15.2 7.6M16.9 3.8L17.2 4.0L17.5 4.3L17.7 4.6L18.0 4.9L18.4 5.3L18.9 5.8L19.3 6.3L19.7 6.8L20.1 7.3L20.4 7.9L20.6 8.1L20.8 8.3L21.0 8.6M20.9 14.1L20.9 13.6L20.8 13.0L20.7 12.4L20.6 11.9L20.4 11.3L20.2 10.8L19.9 10.7L19.5 10.7L19.1 10.7L18.6 10.7L18.1 10.6L17.6 10.6L17.3 11.2L17.0 11.7L16.7 12.2L16.4 12.8L16.0 13.3L15.7 13.8L15.8 14.4L16.0 15.0L16.1 15.6L16.2 16.1L16.3 16.7L16.3 17.2L16.8 17.3L17.3 17.3L17.8 17.4L18.2 17.4L18.6 17.3L19.0 17.3L19.4 16.8L19.7 16.3L20.1 15.8L20.4 15.2L20.7 14.7L20.9 14.1M12.1 3.2L12.2 3.0L12.3 2.8L12.4 2.6L12.5 2.5L12.6 2.5M6.0 4.6L5.9 4.7L5.8 4.9L5.8 5.1L6.2 5.0L6.6 4.8L7.1 4.7L7.6 4.6L8.1 4.6L8.6 4.6L9.2 4.3L9.7 4.0L10.3 3.7L10.9 3.5L11.5 3.4L12.1 3.2M16.3 17.2L16.3 16.7L16.2 16.1L16.1 15.6L16.0 15.0L15.8 14.4L15.7 13.8L15.1 13.7L14.5 13.5L13.9 13.4L13.3 13.2L12.6 13.0L12.0 12.8L11.5 13.2L11.0 13.6L10.5 14.0L10.0 14.4L9.5 14.8L9.1 15.1L9.2 15.7L9.3 16.3L9.4 16.9L9.5 17.5L9.6 18.0L9.8 18.5L10.3 18.7L10.9 18.9L11.6 19.1L12.2 19.3L12.8 19.4L13.4 19.5L13.9 19.2L14.4 18.8L14.9 18.5L15.4 18.1L15.9 17.6L16.3 17.2M17.8 19.6L17.6 19.7L17.1 20.0L16.5 20.3L16.0 20.5L15.4 20.8L14.8 20.9L14.2 21.0L13.7 21.2L13.2 21.4L12.8 21.5L12.3 21.6L11.8 21.6M5.5 9.8L5.2 9.5L4.8 9.2L4.5 9.0L4.3 8.7L4.0 8.5L3.9 8.3L3.5 8.7L3.3 9.1L3.0 9.5L2.8 9.9L2.6 10.3L2.5 10.7L2.5 11.3L2.4 12.0L2.5 12.6L2.6 13.3L2.7 13.9L2.8 14.5L3.0 14.8L3.2 15.1L3.5 15.3L3.8 15.6L4.1 15.8L4.5 16.0L4.6 15.6L4.8 15.3L5.0 14.9L5.2 14.4L5.5 14.0L5.8 13.6L5.7 13.0L5.6 12.3L5.5 11.7L5.5 11.0L5.5 10.4L5.5 9.8M4.5 16.0L4.1 15.8L3.8 15.6L3.5 15.3L3.2 15.1L3.0 14.8L2.8 14.5L2.9 14.8M7.7 20.6L7.5 20.4L7.3 20.2L7.2 19.9L7.1 19.7L7.0 19.3L6.9 19.0L6.4 18.6L6.0 18.1L5.6 17.6L5.2 17.1L4.8 16.5L4.5 16.0'

function Ball(props: IconProps) {
  return (
    <Icon {...props}>
      <path d={BALL_PATCHES} fill="currentColor" fillOpacity="0.55" strokeWidth="0.39" />
      <path d={BALL_SEAMS} strokeWidth="0.45" />
      <circle cx="12" cy="12" r="9.6" />
      <path d="M6.2 6.8a7.6 7.6 0 0 1 4-2.4" strokeOpacity="0.5" />
    </Icon>
  )
}

function Boot(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.6 7.6c1.6 1 3.6 1.1 5.2.3l1.1-.6c1.4 1.4 3.4 2.6 6 3.5l2.4.8c1.7.6 2.6 1.7 2.4 3.1-.1.6-.6 1-1.2 1H3.7c-.5 0-.9-.4-.9-.9.1-2.6.5-5.1 1.8-7.2Z" />
      <path d="M3 15.7h18.6c.1.7-.4 1.3-1.1 1.3H4.1c-.6 0-1.1-.5-1.1-1.3Z" />
      <path d="M5 17v1.9h1.6L7.1 17M9.8 17l.4 1.9h1.6l.2-1.9M15.6 17l.3 1.9h1.6l.3-1.9M19.6 17l-.2 1.6" />
      <path d="M11.4 8.2l-.8 1.3M12.9 9.2l-.9 1.3M14.4 10l-.9 1.3M15.9 10.7l-.8 1.2" strokeWidth="0.59" />
      <path d="M6.2 14.1c3.2-.1 6.6-1 9.3-2.7" strokeOpacity="0.75" />
      <path d="M4.4 10.6c1.3.5 2 1.9 2 5" strokeOpacity="0.6" />
      <path d="M19.3 12.4c-.8.8-1 1.9-.6 3.2" strokeOpacity="0.6" />
    </Icon>
  )
}

function Goal(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.5 20V5.5h19V20" strokeWidth="1.1" />
      <path d="M2.5 5.5 5 8.5h14l2.5-3M5 8.5v9.7M19 8.5v9.7M5 18.2 2.5 20M19 18.2l2.5 1.8" strokeOpacity="0.75" />
      <path d="M5 11.5 8 8.5M5 15l6.5-6.5M5.5 18.2l9.7-9.7M9 18.2 19 8.2M12.5 18.2l6.5-6.5M16 18.2l3-3M8 8.5l9.7 9.7M11.5 8.5 19 16M15 8.5l4 4M5 9.6l8.6 8.6M5 13.1l5.1 5.1" strokeOpacity="0.35" strokeWidth="0.52" />
      <path d="M1.5 20h21" strokeOpacity="0.5" />
    </Icon>
  )
}

function Glove(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7.4 16.5 4.3 12.2a1.7 1.7 0 0 1 2.6-2.2l1.6 1.8V4.9a1.6 1.6 0 0 1 3.2 0V4a1.6 1.6 0 0 1 3.2 0v.9a1.6 1.6 0 0 1 3.2 0v1.8a1.6 1.6 0 0 1 3.1.4v6.6c0 1.6-.5 2.8-1.5 3.6l-.2.2H7.4Z" />
      <path d="M11.7 4.9v6.3M14.9 4.9v6.3M18.1 6.7v4.6" strokeOpacity="0.55" />
      <path d="M9.4 12.6c2.9-.7 6.2-.7 9.8.3" strokeOpacity="0.55" />
      <rect x="7.1" y="16.5" width="12.6" height="4.6" rx="1" />
      <path d="M12.3 16.5v4.6" strokeOpacity="0.7" />
      <path d="M14 18.8h4" strokeOpacity="0.45" />
    </Icon>
  )
}

function Whistle(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9.8 9.6h11c.4 0 .7.3.7.7v2.4c0 .4-.3.7-.7.7h-5.6a6.2 6.2 0 1 1-5.4-3.8Z" />
      <circle cx="9.4" cy="15.6" r="2.6" strokeOpacity="0.6" />
      <path d="M13.4 9.6v-1.4h3v1.4" />
      <path d="M17.3 11.5h3" strokeOpacity="0.5" />
      <path d="M4.4 12.3C3 10.2 2.8 6.6 4.9 4.3 6.6 2.5 9.4 2.3 11 3.6" strokeOpacity="0.55" strokeDasharray="1.2 1.3" />
      <circle cx="4.3" cy="12.7" r="1" />
    </Icon>
  )
}

function Cards(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="5" width="9.5" height="13.5" rx="1.3" transform="rotate(-12 8.8 11.8)" fill="currentColor" fillOpacity="0.18" />
      <rect x="10.5" y="5.2" width="9.5" height="13.5" rx="1.3" transform="rotate(10 15.2 12)" fill="currentColor" fillOpacity="0.4" />
    </Icon>
  )
}

function Pitch(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="1.5" y="4.5" width="21" height="15" rx="1" />
      <path d="M12 4.5v15" />
      <circle cx="12" cy="12" r="2.8" />
      <circle cx="12" cy="12" r="0.35" fill="currentColor" />
      <path d="M1.5 8.3h3.4v7.4H1.5M22.5 8.3h-3.4v7.4h3.4" />
      <path d="M1.5 10.2h1.3v3.6H1.5M22.5 10.2h-1.3v3.6h1.3" strokeOpacity="0.6" />
      <path d="M4.9 10.4a1.9 1.9 0 0 1 0 3.2M19.1 10.4a1.9 1.9 0 0 0 0 3.2" strokeOpacity="0.6" />
    </Icon>
  )
}

function Shirt(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8.6 3.4 4.2 5.2 1.8 10l3.4 1.6 1.4-2.3v11.3h10.8V9.3l1.4 2.3 3.4-1.6-2.4-4.8-4.4-1.8c-.5 1.4-1.8 2.3-3.4 2.3s-2.9-.9-3.4-2.3Z" />
      <path d="M2.6 8.4l3.3 1.6M21.4 8.4l-3.3 1.6" strokeOpacity="0.55" />
      <path d="M8.6 12.2l1-.6v6M11.6 11.6h1.8c.6 0 1 .4 1 1v4c0 .6-.4 1-1 1h-1.8c-.6 0-1-.4-1-1v-4c0-.6.4-1 1-1Z" strokeWidth="0.72" />
    </Icon>
  )
}

function Trophy(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 3h10v5.5a5 5 0 0 1-10 0V3Z" />
      <path d="M7 5H4.6c-.3 2.6 1 4.8 3 5.4M17 5h2.4c.3 2.6-1 4.8-3 5.4" />
      <path d="M10.6 13.4v2.6c0 .8-.8 1.4-1.6 1.6h6c-.8-.2-1.6-.8-1.6-1.6v-2.6" />
      <path d="M7.5 17.6h9l.7 3.4H6.8l.7-3.4Z" />
      <path d="M10 19.2h4" strokeOpacity="0.55" />
      <path d="M9.3 4.8v3.6c0 1 .5 2 1.3 2.6" strokeOpacity="0.45" />
    </Icon>
  )
}

function Cone(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10.7 3.4h2.6l5.2 14.8H5.5l5.2-14.8Z" />
      <path d="M8.9 8.6h6.2M7.4 13h9.2" strokeWidth="1.23" strokeOpacity="0.5" />
      <path d="M3.2 18.2h17.6l.9 2.4H2.3l.9-2.4Z" />
    </Icon>
  )
}

function Stopwatch(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="13.5" r="8" />
      <circle cx="12" cy="13.5" r="6.2" strokeOpacity="0.4" />
      <path d="M10.2 2.6h3.6M12 2.6v2.9" />
      <path d="M18.3 6.3l1.4-1.4M19 4.2l1.4 1.4" />
      <path d="M12 13.5V9.3M12 13.5l2.8 1.8" />
      <circle cx="12" cy="13.5" r="0.6" fill="currentColor" />
      <path d="M12 7.6v.8M17.9 13.5h-.8M12 19.4v-.8M6.1 13.5h.8" strokeOpacity="0.55" />
    </Icon>
  )
}

function ShinGuard(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7.4 3.2c3-.9 6.2-.9 9.2 0 .6.2 1 .8.9 1.4l-1.3 12.7c-.3 2.4-2.1 4-4.2 4s-3.9-1.6-4.2-4L6.5 4.6c-.1-.6.3-1.2.9-1.4Z" />
      <path d="M8.6 5.4c2.2-.5 4.6-.5 6.8 0l-1 10.9c-.2 1.5-1.2 2.5-2.4 2.5s-2.2-1-2.4-2.5L8.6 5.4Z" strokeOpacity="0.45" />
      <path d="M6.9 8.2h10.2M6.9 12.8h10.2" strokeOpacity="0.7" strokeWidth="1.04" />
    </Icon>
  )
}

function CornerFlag(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M6 21V2.8" strokeWidth="0.98" />
      <path d="M6 3.2c2.2-.8 4 .6 6.2.2 1.6-.3 2.9-1 4.3-.6l-1.6 3.6 1.9 3.3c-1.7-.3-3 .4-4.6.7-2.2.4-4-.9-6.2-.2" fill="currentColor" fillOpacity="0.3" />
      <path d="M12.6 21A6.6 6.6 0 0 0 6 14.4" />
      <path d="M2 21h20M6 14.4H2" strokeOpacity="0.55" />
    </Icon>
  )
}

function Scoreboard(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2" y="3.5" width="20" height="12.5" rx="1.5" />
      <path d="M2 6.6h20" strokeOpacity="0.55" />
      <rect x="4.4" y="8.4" width="5.6" height="5.4" rx="0.8" strokeOpacity="0.55" />
      <rect x="14" y="8.4" width="5.6" height="5.4" rx="0.8" strokeOpacity="0.55" />
      <path d="M6.3 9.7l1.2-.6v3.6" />
      <rect x="15.9" y="9.2" width="1.8" height="3.6" rx="0.9" />
      <circle cx="12" cy="10" r="0.45" fill="currentColor" />
      <circle cx="12" cy="12.2" r="0.45" fill="currentColor" />
      <path d="M7 16v5M17 16v5M4.5 21h15" />
    </Icon>
  )
}

function Tactics(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="2.5" y="3.5" width="19" height="17" rx="1.5" />
      <path d="M12 3.5v17M2.5 8h3v8h-3M21.5 8h-3v8h3" strokeOpacity="0.35" />
      <circle cx="12" cy="12" r="2.2" strokeOpacity="0.35" />
      <path d="M6.4 6.4l1.8 1.8M8.2 6.4 6.4 8.2" />
      <path d="M8.4 15.6l1.6 1.6M10 15.6l-1.6 1.6" />
      <circle cx="17" cy="15.5" r="1.4" />
      <circle cx="15" cy="7.2" r="1.4" />
      <path d="M9 9.2c1.6 3.4 3.6 5.2 6.4 5.9" strokeDasharray="1.5 1.6" />
      <path d="M14.4 13.9l1.6 1.4-2 .7" />
    </Icon>
  )
}

const ICONS: Record<string, ComponentType<IconProps>> = {
  ball: Ball,
  goal: Goal,
  glove: Glove,
  whistle: Whistle,
  boot: Boot,
  shirt: Shirt,
  pitch: Pitch,
  corner: CornerFlag,
  card: Cards,
  trophy: Trophy,
  shin: ShinGuard,
  tactics: Tactics,
  cone: Cone,
  score: Scoreboard,
  timer: Stopwatch,
}

const ORDER = [
  'ball', 'goal', 'glove', 'whistle', 'boot', 'shirt', 'pitch', 'corner', 'card', 'ball', 'trophy',
  'shin', 'tactics', 'cone', 'score', 'ball', 'glove', 'goal', 'timer', 'boot', 'ball', 'corner',
]

function seeded(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const PLACEMENT = (() => {
  const rnd = seeded(20221117)
  const cols = 7
  const rows = 7
  const items: { key: string; x: number; y: number; size: number; rot: number }[] = []
  let k = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rnd() < 0.36) continue
      const x = ((c + 0.5 + (rnd() - 0.5) * 0.3) / cols) * 100
      const y = ((r + 0.5 + (rnd() - 0.5) * 0.3) / rows) * 100
      const size = 3.6 + rnd() * 3
      const rot = Math.round((rnd() - 0.5) * 36)
      items.push({ key: ORDER[k % ORDER.length], x, y, size, rot })
      k++
    }
  }
  return items.sort((a, b) => b.size - a.size)
})()

export default function PitchBackdrop() {
  return (
    <div className="pitch-backdrop" aria-hidden="true">
      {PLACEMENT.map(({ key, x, y, size, rot }, i) => {
        const Icon = ICONS[key]
        return (
          <Icon
            key={i}
            strokeWidth={0.9}
            className="pitch-backdrop__icon"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: `min(${size}rem, ${(size / 6.6) * 11}vw)`,
              height: `min(${size}rem, ${(size / 6.6) * 11}vw)`,
              transform: `translate(-50%, -50%) rotate(${rot}deg)`,
              animationDelay: `${(i % 9) * 1.3}s`,
            }}
          />
        )
      })}
    </div>
  )
}
