import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function AdminProtectedRoute() {
  const { token, user, authLoading } = useAuth()

  if (!token) {
    return <Navigate to="/admin/login" replace />
  }

  if (authLoading) {
    return null
  }

  if (!user?.is_super_admin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
