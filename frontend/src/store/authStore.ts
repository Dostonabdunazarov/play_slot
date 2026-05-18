import { create } from 'zustand'
import type { User } from '../types'

interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  logout: () => void
  isAdmin: () => boolean
}

const storedToken = localStorage.getItem('token')
const storedUserRaw = localStorage.getItem('user')

let storedUser: User | null = null
try {
  storedUser = storedUserRaw && storedUserRaw !== 'undefined' ? JSON.parse(storedUserRaw) : null
} catch {
  localStorage.removeItem('user')
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: storedToken,
  user: storedUser,

  setAuth: (token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
    set({ token, user })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ token: null, user: null })
  },

  isAdmin: () => get().user?.role === 'Admin',
}))
