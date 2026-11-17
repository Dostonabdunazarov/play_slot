import { useSyncExternalStore } from 'react'
import { isAxiosError } from 'axios'

const KEY = 'guestRequests'
const MAX = 20
const listeners = new Set<() => void>()

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === 'string') : []
  } catch {
    return []
  }
}

let snapshot = read()

function write(tokens: string[]) {
  snapshot = tokens
  try {
    localStorage.setItem(KEY, JSON.stringify(tokens))
  } catch {
    snapshot = tokens
  }
  listeners.forEach((l) => l())
}

export function rememberRequest(token: string) {
  write([token, ...snapshot.filter((t) => t !== token)].slice(0, MAX))
}

export function forgetRequests(tokens: string[]) {
  const drop = new Set(tokens)
  write(snapshot.filter((t) => !drop.has(t)))
}

export function useRequestTokens(): string[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => snapshot
  )
}

export function apiErrorCode(err: unknown): string | null {
  if (isAxiosError(err)) {
    const code = (err.response?.data as { code?: string } | undefined)?.code
    if (code) return code
    if (err.response?.status === 429) return 'rate_limited'
  }
  return null
}

export function minutesLeft(expiresAt: string, now: number): number {
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - now) / 60000))
}

export function formatPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^998/, '').slice(0, 9)
  const parts = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)].filter(Boolean)
  return parts.join(' ')
}

export function phoneDigits(formatted: string): string {
  return formatted.replace(/\D/g, '')
}
