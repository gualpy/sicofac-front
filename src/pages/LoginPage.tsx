import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { useAuth } from '../auth/AuthContext'
import { AuthLayout } from '../components/auth/AuthLayout'
import { AuthField } from '../components/auth/AuthField'

export function LoginPage() {
  const { login, resendVerification } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setNeedsVerification(false)
    setResent(false)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 403 && err.response.data?.code === 'EMAIL_NOT_VERIFIED') {
        setNeedsVerification(true)
        setError('Debes confirmar tu correo antes de iniciar sesion.')
        return
      }
      setError('Credenciales invalidas.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    setResending(true)
    try {
      await resendVerification(email)
      setResent(true)
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout
      headlineTop="Factura con"
      headlineAccent="confianza total."
      subtitle="Firma electronica, SRI y punto de venta en un solo lugar para tu negocio. Sin instalar nada."
    >
      <div className="auth-card">
        <div className="auth-card-header">
          <span className="auth-card-icon">
            <i className="fa-solid fa-shield-halved" />
          </span>
          <div>
            <h1>Bienvenido de nuevo</h1>
            <p>Ingresa tus credenciales para continuar</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <AuthField
            label="Correo electronico"
            icon="fa-envelope"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="nombre@empresa.com"
            required
            autoComplete="email"
          />
          <AuthField
            label="Contrasena"
            icon="fa-lock"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="Tu contrasena"
            required
            autoComplete="current-password"
          />

          {error && <p role="alert">{error}</p>}
          {needsVerification && (
            <button type="button" className="linklike" onClick={handleResend} disabled={resending || resent} style={{ marginBottom: 16 }}>
              {resent ? 'Correo reenviado' : resending ? 'Enviando...' : 'Reenviar correo de confirmacion'}
            </button>
          )}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? 'Ingresando...' : 'Iniciar sesion'}
            <i className="fa-solid fa-arrow-right" />
          </button>
        </form>

        <p className="auth-footer">
          No tenes cuenta? <Link to="/register">Registrate aqui</Link>
        </p>
      </div>
    </AuthLayout>
  )
}
