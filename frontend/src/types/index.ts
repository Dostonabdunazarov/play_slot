export type Role = 'Admin' | 'User'
export type BookingStatus = 'Active' | 'Cancelled' | 'Pending' | 'Rejected' | 'Expired'
export type RequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Expired' | 'CancelledByGuest'
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
  paymentDetails?: string | null
  prepaymentPercent?: number | null
  prepaymentFixed?: number | null
}

export interface Booking {
  id: string
  venueId: string
  venueName: string
  userId: string | null
  createdByName: string
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
  bookingRequestId?: string | null
}

export interface GuestRequest {
  token: string
  status: RequestStatus
  venueId: string
  venueName: string
  venueAddress: string
  venuePhone: string
  date: string
  startTime: string
  endTime: string
  hours: number
  totalAmount: number
  clientName: string
  createdAt: string
  expiresAt: string
  decidedAt?: string | null
  rejectReason?: string | null
  language: string
  telegramLinked: boolean
  telegramUrl?: string | null
  paymentDetails?: string | null
  prepaymentAmount?: number | null
}

export interface StaffRequest {
  id: string
  status: RequestStatus
  venueId: string
  venueName: string
  date: string
  startTime: string
  endTime: string
  hours: number
  totalAmount: number
  prepaymentAmount?: number | null
  clientName: string
  clientPhone: string
  comment?: string | null
  language: string
  createdAt: string
  expiresAt: string
  decidedAt?: string | null
  decidedByName?: string | null
  rejectReason?: string | null
  telegramLinked: boolean
}

export interface CreateGuestRequest {
  venueId: string
  date: string
  startTime: string
  hours: number
  clientName: string
  clientPhone: string
  comment?: string
  language: string
  website?: string
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
  paymentDetails?: string | null
  prepaymentPercent?: number | null
  prepaymentFixed?: number | null
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
