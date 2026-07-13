import api from './client'
import type { DashboardStats } from '../types'

export const getDashboardStats = (from?: string, to?: string) =>
  api
    .get<DashboardStats>('/stats/dashboard', { params: { from, to } })
    .then((r) => r.data)
