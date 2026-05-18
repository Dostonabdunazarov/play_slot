import api from './client'
import type { Venue, CreateVenueRequest } from '../types'

export const getVenues = () => api.get<Venue[]>('/venues').then((r) => r.data)

export const getVenue = (id: string) =>
  api.get<Venue>(`/venues/${id}`).then((r) => r.data)

export const createVenue = (data: CreateVenueRequest) =>
  api.post<Venue>('/venues', data).then((r) => r.data)

export const updateVenue = (id: string, data: Partial<CreateVenueRequest>) =>
  api.put<Venue>(`/venues/${id}`, data).then((r) => r.data)

export const deleteVenue = (id: string) => api.delete(`/venues/${id}`)
