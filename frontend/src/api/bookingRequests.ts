import api from './client'
import type { CreateGuestRequest, GuestRequest, StaffRequest } from '../types'

export const createGuestRequest = (data: CreateGuestRequest) =>
  api.post<GuestRequest>('/booking-requests', data).then((r) => r.data)

export const getGuestRequest = (token: string) =>
  api.get<GuestRequest>(`/booking-requests/public/${encodeURIComponent(token)}`).then((r) => r.data)

export const getGuestRequests = (tokens: string[]) =>
  api.post<GuestRequest[]>('/booking-requests/public/statuses', { tokens }).then((r) => r.data)

export const cancelGuestRequest = (token: string) =>
  api.post<GuestRequest>(`/booking-requests/public/${encodeURIComponent(token)}/cancel`).then((r) => r.data)

export const getStaffRequests = (status: 'pending' | 'all') =>
  api.get<StaffRequest[]>('/booking-requests', { params: { status } }).then((r) => r.data)

export const getPendingCount = () =>
  api.get<{ count: number }>('/booking-requests/pending-count').then((r) => r.data.count)

export const getStaffRequest = (id: string) =>
  api.get<StaffRequest>(`/booking-requests/${id}`).then((r) => r.data)

export const approveRequest = (id: string) =>
  api.post<StaffRequest>(`/booking-requests/${id}/approve`).then((r) => r.data)

export const rejectRequest = (id: string, reason: string | null) =>
  api.post<StaffRequest>(`/booking-requests/${id}/reject`, { reason }).then((r) => r.data)
