import api from './client'
import type { Booking, CreateBookingRequest, UpdatePaymentRequest } from '../types'

export const getBookingsByVenueAndDate = (venueId: string, date: string) =>
  api.get<Booking[]>('/bookings', { params: { venueId, date } }).then((r) => r.data)

export const getAllBookings = () =>
  api.get<Booking[]>('/bookings/all').then((r) => r.data)

export const getMyBookings = () =>
  api.get<Booking[]>('/bookings/my').then((r) => r.data)

export const createBooking = (data: CreateBookingRequest) =>
  api.post<Booking>('/bookings', data).then((r) => r.data)

export const updatePayment = (id: string, data: UpdatePaymentRequest) =>
  api.patch<Booking>(`/bookings/${id}/payment`, data).then((r) => r.data)

export const cancelBooking = (id: string) =>
  api.delete(`/bookings/${id}`)
