import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'

export function AdminShell() {
  const { user, logout } = useAuth()

  return (
    <div>
      <header className="topbar">
        <span className="brand">SICOFAC Admin</span>
        <nav>
          <Link to="/admin">Dashboard</Link>
          <Link to="/admin/plans">Planes</Link>
        </nav>
        <div className="user-menu">
          <span className="user-menu-name">{user?.name}</span>
          <button type="button" className="linklike" style={{ marginLeft: 12 }} onClick={() => logout()}>
            <i className="fa-solid fa-right-from-bracket" /> Cerrar sesion
          </button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
