import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { useAuth } from '../auth/AuthContext'
import { AuthLayout } from '../components/auth/AuthLayout'
import { AuthField } from '../components/auth/AuthField'

export function ResetPasswordPage() {
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const invalidLink = !token || !email

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (password !== passwordConfirmation) {
      setError('Las contrasenas no coinciden.')
      return
    }

    setSubmitting(true)
    try {
      await resetPassword({ email, token, password, password_confirmation: passwordConfirmation })
      navigate('/login')
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 422) {
        setError('El enlace vencio o ya fue usado. Pedi uno nuevo.')
        return
      }
      setError('No se pudo actualizar la contrasena.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      headlineTop="Elegi una"
      headlineAccent="contrasena nueva."
      subtitle="Una vez actualizada, vas a tener que iniciar sesion de nuevo en todos tus dispositivos."
    >
      <div className="auth-card">
        {invalidLink ? (
          <div style={{ textAlign: 'center' }}>
            <div
              className="auth-card-icon"
              style={{ margin: '0 auto 16px', width: 52, height: 52, fontSize: 22, background: 'var(--danger-pastel-bg)', color: 'var(--danger)' }}
            >
              <i className="fa-solid fa-triangle-exclamation" />
            </div>
            <h1 style={{ marginBottom: 8 }}>Enlace invalido</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
              Pedi un nuevo enlace desde la pantalla de "Contrasena olvidada".
            </p>
            <Link to="/forgot-password" className="auth-submit" style={{ textDecoration: 'none' }}>
              Pedir enlace nuevo
            </Link>
          </div>
        ) : (
          <>
            <div className="auth-card-header">
              <span className="auth-card-icon">
                <i className="fa-solid fa-lock-open" />
              </span>
              <div>
                <h1>Nueva contrasena</h1>
                <p>Para {email}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <AuthField
                label="Contrasena nueva"
                icon="fa-lock"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Minimo 8 caracteres"
                minLength={8}
                required
                autoComplete="new-password"
              />
              <AuthField
                label="Confirmar"
                icon="fa-lock"
                type="password"
                value={passwordConfirmation}
                onChange={setPasswordConfirmation}
                placeholder="Repeti la contrasena"
                minLength={8}
                required
                autoComplete="new-password"
              />

              {error && <p role="alert">{error}</p>}

              <button type="submit" className="auth-submit" disabled={submitting}>
                {submitting ? 'Actualizando...' : 'Actualizar contrasena'}
                <i className="fa-solid fa-arrow-right" />
              </button>
            </form>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
