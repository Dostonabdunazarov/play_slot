import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface Props {
  children: React.ReactNode
  adminOnly?: boolean
  // Public routes (venues + schedule) are viewable by guests without a login.
  publicRoute?: boolean
}

export default function ProtectedRoute({ children, adminOnly = false, publicRoute = false }: Props) {
  const { token, isAdmin } = useAuthStore()

  if (!token && !publicRoute) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin()) return <Navigate to="/venues" replace />

  return <>{children}</>
}
