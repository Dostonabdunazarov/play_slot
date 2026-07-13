export type Role = 'Admin' | 'User'
export type BookingStatus = 'Active' | 'Cancelled'
export type PaymentStatus = 'Unpaid' | 'Prepaid' | 'FullyPaid'

export interface User {
  id: string
  fullName: string
  phone: string
  email: string
  role: Role
  createdAt: string
}

export interface Venue {
  id: string
  name: string
  address: string
  phone: string
  description: string
  imageUrl: string
  pricePerHour: number
  openTime: string
  closeTime: string
  isActive: boolean
  createdAt: string
}

export interface Booking {
  id: string
  venueId: string
  venueName: string
  userId: string
  clientName: string
  clientPhone: string
  date: string
  startTime: string
  endTime: string
  totalAmount: number
  prepaymentAmount?: number
  paymentStatus: PaymentStatus
  notes?: string
  status: BookingStatus
  createdAt: string
  cancelledAt?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface CreateVenueRequest {
  name: string
  address: string
  phone: string
  description: string
  imageUrl: string
  pricePerHour: number
  openTime: string
  closeTime: string
  isActive?: boolean
}

export interface CreateBookingRequest {
  venueId: string
  clientName: string
  clientPhone: string
  date: string
  startTime: string
  notes?: string
}

export interface CreateUserRequest {
  fullName: string
  phone: string
  email: string
  password: string
  role: Role
}

export interface UpdatePaymentRequest {
  paymentStatus: PaymentStatus
  prepaymentAmount?: number
}

export interface VenueLoad {
  venueId: string
  venueName: string
  bookings: number
  hoursBooked: number
  paidRevenue: number
  outstandingAmount: number
}

export interface DashboardStats {
  from: string
  to: string
  paidRevenue: number
  expectedRevenue: number
  outstandingAmount: number
  totalBookings: number
  activeBookings: number
  cancelledBookings: number
  unpaidCount: number
  venueLoad: VenueLoad[]
}
