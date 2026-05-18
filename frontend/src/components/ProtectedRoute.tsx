import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

interface Props {
  children: React.ReactNode
  adminOnly?: boolean
}

export default function ProtectedRoute({ children, adminOnly = false }: Props) {
  const { token, isAdmin } = useAuthStore()

  if (!token) return <Navigate to="/login" replace />
  if (adminOnly && !isAdmin()) return <Navigate to="/venues" replace />

  return <>{children}</>
}
