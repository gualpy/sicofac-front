import { useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { AuthLayout } from '../../components/auth/AuthLayout'

export function AdminLoginCallbackPage() {
  const [searchParams] = useSearchParams()
  const { loginWithToken } = useAuth()
  const navigate = useNavigate()
  const ok = searchParams.get('ok') === '1'
  const token = searchParams.get('token')
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    if (ok && token) {
      loginWithToken(token)
      navigate('/admin', { replace: true })
    }
  }, [ok, token, loginWithToken, navigate])

  if (ok && token) {
    return null // redirecting
  }

  return (
    <AuthLayout headlineTop="Enlace" headlineAccent="invalido o vencido." subtitle="Pedi un enlace nuevo desde la pantalla de acceso de administrador.">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div
          className="auth-card-icon"
          style={{ margin: '0 auto 16px', width: 52, height: 52, fontSize: 22, background: 'var(--danger-pastel-bg)', color: 'var(--danger)' }}
        >
          <i className="fa-solid fa-triangle-exclamation" />
        </div>
        <h1 style={{ marginBottom: 8 }}>Enlace invalido o vencido</h1>
        <p className="auth-footer">
          <Link to="/admin/login">Pedir un enlace nuevo</Link>
        </p>
      </div>
    </AuthLayout>
  )
}
