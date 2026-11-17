import { useEffect, useRef, type CSSProperties } from 'react'

type Vec = [number, number, number]

const PHI = (1 + Math.sqrt(5)) / 2

function norm(v: Vec): Vec {
  const l = Math.hypot(v[0], v[1], v[2])
  return [v[0] / l, v[1] / l, v[2] / l]
}

function dot(a: Vec, b: Vec) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function cross(a: Vec, b: Vec): Vec {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
}

function cyclic(base: Vec[]): Vec[] {
  const out: Vec[] = []
  for (const [a, b, c] of base) {
    for (const sa of a ? [1, -1] : [1]) {
      for (const sb of b ? [1, -1] : [1]) {
        for (const sc of c ? [1, -1] : [1]) {
          const v: Vec = [a * sa, b * sb, c * sc]
          out.push(v, [v[1], v[2], v[0]], [v[2], v[0], v[1]])
        }
      }
    }
  }
  return out
}

interface Face {
  center: Vec
  pent: boolean
  outline: Vec[]
}

function buildBall(): Face[] {
  const verts = cyclic([
    [0, 1, 3 * PHI],
    [1, 2 + PHI, 2 * PHI],
    [PHI, 2, 2 * PHI + 1],
  ]).map(norm)
  const pentCenters = cyclic([[0, 1, PHI]]).map(norm)
  const hexCenters = [
    ...[-1, 1].flatMap((x) => [-1, 1].flatMap((y) => [-1, 1].map((z) => [x, y, z] as Vec))),
    ...cyclic([[0, PHI, 1 / PHI]]),
  ].map(norm)

  const make = (center: Vec, k: number, pent: boolean): Face => {
    const corners = [...verts].sort((a, b) => dot(b, center) - dot(a, center)).slice(0, k)
    const ref = norm(cross(center, Math.abs(center[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]))
    const ref2 = cross(center, ref)
    corners.sort((a, b) => Math.atan2(dot(a, ref2), dot(a, ref)) - Math.atan2(dot(b, ref2), dot(b, ref)))
    const outline: Vec[] = []
    const steps = 5
    for (let i = 0; i < corners.length; i++) {
      const a = corners[i]
      const b = corners[(i + 1) % corners.length]
      for (let s = 0; s < steps; s++) {
        const t = s / steps
        outline.push(norm([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]))
      }
    }
    return { center, pent, outline }
  }

  return [...pentCenters.map((c) => make(c, 5, true)), ...hexCenters.map((c) => make(c, 6, false))]
}

const FACES = buildBall()
const LIGHT = norm([-0.45, 0.6, 0.75])
const TILT = 0.42
const SPEED = 1.1

const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  orbit: 1.08 + ((i * 37) % 11) / 22,
  phase: (i * 2.399) % (Math.PI * 2),
  speed: 0.25 + ((i * 53) % 7) / 18,
  size: 0.022 + ((i * 29) % 5) / 160,
  flicker: 1.3 + ((i * 17) % 9) / 4,
}))

function rotate(v: Vec, yaw: number, wobble: number): Vec {
  const cy = Math.cos(yaw)
  const sy = Math.sin(yaw)
  const x1 = v[0] * cy + v[2] * sy
  const z1 = -v[0] * sy + v[2] * cy
  const tilt = TILT + wobble
  const ct = Math.cos(tilt)
  const st = Math.sin(tilt)
  const y2 = v[1] * ct - z1 * st
  const z2 = v[1] * st + z1 * ct
  const cz = Math.cos(0.3)
  const sz = Math.sin(0.3)
  return [x1 * cz - y2 * sz, x1 * sz + y2 * cz, z2]
}

function mix(a: number[], b: number[], t: number) {
  return a.map((x, i) => Math.round(x + (b[i] - x) * t))
}

function draw(ctx: CanvasRenderingContext2D, size: number, time: number) {
  const c = size / 2
  const r = size / 3.3
  ctx.clearRect(0, 0, size, size)

  const halo = ctx.createRadialGradient(c, c, r * 0.97, c, c, r * 1.62)
  halo.addColorStop(0, 'rgba(40, 225, 255, 0.7)')
  halo.addColorStop(0.45, 'rgba(40, 225, 255, 0.22)')
  halo.addColorStop(1, 'rgba(56, 232, 255, 0)')
  ctx.fillStyle = halo
  ctx.beginPath()
  ctx.rect(0, 0, size, size)
  ctx.arc(c, c, r * 0.99, 0, Math.PI * 2, true)
  ctx.fill('evenodd')

  const yaw = time * SPEED
  const wobble = Math.sin(time * 0.7) * 0.12

  ctx.save()
  ctx.beginPath()
  ctx.arc(c, c, r, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(2, 17, 22, 0.12)'
  ctx.fill()
  ctx.clip()

  const shown = FACES.map((f) => ({ f, n: rotate(f.center, yaw, wobble) }))
    .filter(({ n }) => n[2] > -0.35)
    .sort((a, b) => a.n[2] - b.n[2])

  ctx.lineJoin = 'round'
  for (const { f, n } of shown) {
    const lit = Math.max(0, dot(n, LIGHT))
    const facing = Math.max(0, n[2])
    ctx.beginPath()
    f.outline.forEach((p, i) => {
      const q = rotate(p, yaw, wobble)
      const x = c + q[0] * r
      const y = c - q[1] * r
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()
    if (f.pent) {
      const [cr, cg, cb] = mix([3, 22, 30], [10, 70, 88], lit * facing)
      ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, 0.28)`
    } else {
      const k = Math.min(1, 0.25 + 0.45 * facing + 0.5 * lit)
      const [cr, cg, cb] = mix([4, 92, 124], [80, 238, 255], k)
      ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`
    }
    ctx.fill()
    ctx.strokeStyle = 'rgba(1, 12, 16, 0.7)'
    ctx.lineWidth = r * 0.055
    ctx.stroke()
    ctx.strokeStyle = `rgba(150, 250, 255, ${0.1 + 0.35 * facing})`
    ctx.lineWidth = r * 0.012
    ctx.stroke()
  }

  const spec = ctx.createRadialGradient(c - r * 0.38, c - r * 0.42, 0, c - r * 0.38, c - r * 0.42, r * 0.75)
  spec.addColorStop(0, 'rgba(200, 255, 255, 0.32)')
  spec.addColorStop(1, 'rgba(200, 255, 255, 0)')
  ctx.globalCompositeOperation = 'lighter'
  ctx.fillStyle = spec
  ctx.fillRect(0, 0, size, size)
  ctx.globalCompositeOperation = 'source-over'

  const shade = ctx.createRadialGradient(c, c, r * 0.7, c, c, r)
  shade.addColorStop(0, 'rgba(0, 10, 14, 0)')
  shade.addColorStop(1, 'rgba(0, 10, 14, 0.35)')
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, size, size)
  ctx.restore()

  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.shadowColor = 'rgba(56, 232, 255, 0.9)'
  ctx.shadowBlur = r * 0.35
  ctx.strokeStyle = 'rgba(110, 240, 255, 0.55)'
  ctx.lineWidth = r * 0.04
  ctx.beginPath()
  ctx.arc(c, c, r * 0.99, 0, Math.PI * 2)
  ctx.stroke()
  ctx.shadowBlur = 0

  for (const p of PARTICLES) {
    const a = p.phase + time * p.speed
    const x = c + Math.cos(a) * r * p.orbit
    const y = c + Math.sin(a * 1.3) * r * p.orbit * 0.8
    const alpha = 0.35 + 0.65 * Math.abs(Math.sin(time * p.flicker + p.phase))
    ctx.fillStyle = `rgba(140, 245, 255, ${alpha})`
    ctx.beginPath()
    ctx.arc(x, y, Math.max(0.6, r * p.size), 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

export default function NeonBall({ className = '', style }: { className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    let size = 0
    let visible = true
    const start = performance.now()

    const resize = () => {
      const css = canvas.getBoundingClientRect().width
      const dpr = Math.min(window.devicePixelRatio || 1, 3)
      size = Math.round(css * dpr)
      if (size && (canvas.width !== size || canvas.height !== size)) {
        canvas.width = size
        canvas.height = size
      }
    }

    const tick = (now: number) => {
      frame = 0
      if (!size) return
      draw(ctx, size, reduce.matches ? 0.6 : (now - start) / 1000)
      if (!reduce.matches && visible) frame = requestAnimationFrame(tick)
    }

    const kick = () => {
      if (!frame) frame = requestAnimationFrame(tick)
    }

    const ro = new ResizeObserver(() => {
      resize()
      kick()
    })
    ro.observe(canvas)

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) kick()
    })
    io.observe(canvas)

    reduce.addEventListener('change', kick)

    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
      io.disconnect()
      reduce.removeEventListener('change', kick)
    }
  }, [])

  return <canvas ref={ref} aria-hidden className={className} style={style} />
}
