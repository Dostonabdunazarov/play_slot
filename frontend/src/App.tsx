import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import './i18n'

import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

import LoginPage from './pages/LoginPage'
import VenuesPage from './pages/VenuesPage'
import VenueDetailPage from './pages/VenueDetailPage'
import MyBookingsPage from './pages/MyBookingsPage'
import NewBookingPage from './pages/NewBookingPage'
import GuestRequestPage from './pages/GuestRequestPage'
import MyRequestsPage from './pages/MyRequestsPage'
import RequestsPage from './pages/RequestsPage'
import RequestDetailPage from './pages/RequestDetailPage'
import AdminVenuesPage from './pages/admin/AdminVenuesPage'
import AdminBookingsPage from './pages/admin/AdminBookingsPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminSchedulePage from './pages/admin/AdminSchedulePage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '14px',
            background: 'var(--color-raised)',
            color: 'var(--color-ink)',
            border: '1px solid var(--color-line-strong)',
            boxShadow: 'var(--shadow-float)',
            fontSize: '0.875rem',
            fontWeight: 500,
            padding: '0.625rem 0.875rem',
          },
          success: { iconTheme: { primary: 'var(--color-paid)', secondary: 'var(--color-raised)' } },
          error: { iconTheme: { primary: 'var(--color-due)', secondary: 'var(--color-raised)' } },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <ProtectedRoute publicRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Public: guests can browse venues and view schedules. */}
            <Route path="/venues" element={<VenuesPage />} />
            <Route path="/venues/:id" element={<VenueDetailPage />} />
            <Route path="/r/:token" element={<GuestRequestPage />} />
            <Route path="/my-requests" element={<MyRequestsPage />} />
            <Route
              path="/requests"
              element={
                <ProtectedRoute>
                  <RequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/requests/:id"
              element={
                <ProtectedRoute>
                  <RequestDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Require login: booking management. */}
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute>
                  <MyBookingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings/new"
              element={
                <ProtectedRoute>
                  <NewBookingPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/schedule"
              element={
                <ProtectedRoute adminOnly>
                  <AdminSchedulePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/venues"
              element={
                <ProtectedRoute adminOnly>
                  <AdminVenuesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/bookings"
              element={
                <ProtectedRoute adminOnly>
                  <AdminBookingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute adminOnly>
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/venues" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
