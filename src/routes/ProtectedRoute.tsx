import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { LandingPage } from '../pages/LandingPage'

export function ProtectedRoute() {
  const { token } = useAuth()
  const location = useLocation()

  if (!token) {
    // "/" is the public home: show the marketing landing page instead of
    // bouncing to /login, so a logged-out visitor sees SICOFAC's pitch.
    if (location.pathname === '/') {
      return <LandingPage />
    }

    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
