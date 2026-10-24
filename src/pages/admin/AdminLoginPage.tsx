import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { requestAdminMagicLink } from '../../api/admin'
import { AuthLayout } from '../../components/auth/AuthLayout'
import { AuthField } from '../../components/auth/AuthField'

export function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSending(true)
    try {
      await requestAdminMagicLink(email)
      setSent(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <AuthLayout
      headlineTop="Panel de"
      headlineAccent="Super Admin."
      subtitle="Acceso solo por enlace: sin contrasena, directo a tu correo registrado."
    >
      <div className="auth-card">
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div className="auth-card-icon" style={{ margin: '0 auto 16px', width: 52, height: 52, fontSize: 22 }}>
              <i className="fa-solid fa-envelope-circle-check" />
            </div>
            <h1 style={{ marginBottom: 8 }}>Revisa tu correo</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
              Si <strong>{email}</strong> tiene acceso de administrador, te enviamos un enlace. Vence en 15
              minutos.
            </p>
          </div>
        ) : (
          <>
            <div className="auth-card-header">
              <span className="auth-card-icon">
                <i className="fa-solid fa-user-shield" />
              </span>
              <div>
                <h1>Acceso de administrador</h1>
                <p>Te enviamos un enlace para entrar sin contrasena</p>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <AuthField
                label="Correo registrado"
                icon="fa-envelope"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="admin@sicofac.com"
                required
                autoComplete="email"
              />

              <button type="submit" className="auth-submit" disabled={sending}>
                {sending ? 'Enviando...' : 'Enviarme el enlace'}
                <i className="fa-solid fa-arrow-right" />
              </button>
            </form>

            <p className="auth-footer">
              <Link to="/login">Volver al inicio de sesion normal</Link>
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
