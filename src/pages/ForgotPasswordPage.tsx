import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { AuthLayout } from '../components/auth/AuthLayout'
import { AuthField } from '../components/auth/AuthField'

export function ForgotPasswordPage() {
  const { forgotPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSending(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <AuthLayout
      headlineTop="Recupera tu"
      headlineAccent="acceso."
      subtitle="Te enviamos un enlace para elegir una contrasena nueva. Vence en 60 minutos."
    >
      <div className="auth-card">
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div className="auth-card-icon" style={{ margin: '0 auto 16px', width: 52, height: 52, fontSize: 22 }}>
              <i className="fa-solid fa-envelope-circle-check" />
            </div>
            <h1 style={{ marginBottom: 8 }}>Revisa tu correo</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 4 }}>
              Si <strong>{email}</strong> esta registrado, te enviamos un enlace para restablecer tu contrasena.
            </p>
            <p className="auth-footer">
              <Link to="/login">Volver a inicio de sesion</Link>
            </p>
          </div>
        ) : (
          <>
            <div className="auth-card-header">
              <span className="auth-card-icon">
                <i className="fa-solid fa-key" />
              </span>
              <div>
                <h1>Contrasena olvidada</h1>
                <p>Ingresa tu correo para recibir el enlace</p>
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

              <button type="submit" className="auth-submit" disabled={sending}>
                {sending ? 'Enviando...' : 'Enviar enlace'}
                <i className="fa-solid fa-arrow-right" />
              </button>
            </form>

            <p className="auth-footer">
              <Link to="/login">Volver a inicio de sesion</Link>
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
