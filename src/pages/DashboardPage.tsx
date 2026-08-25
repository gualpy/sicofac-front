import { useAuth } from '../auth/AuthContext'

export function DashboardPage() {
  const { logout } = useAuth()

  return (
    <div>
      <h1>Dashboard</h1>
      <button type="button" onClick={() => logout()}>
        Salir
      </button>
    </div>
  )
}
