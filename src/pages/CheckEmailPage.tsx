import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { AuthLayout } from '../components/auth/AuthLayout'

export function CheckEmailPage() {
  const { resendVerification } = useAuth()
  const location = useLocation() as { state?: { email?: string } }
  const email = location.state?.email ?? ''
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleResend() {
    if (!email) return
    setSending(true)
    try {
      await resendVerification(email)
      setSent(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <AuthLayout
      headlineTop="Ya casi"
      headlineAccent="estamos listos."
      subtitle="Un ultimo paso: confirma tu correo y empeza a facturar en minutos."
    >
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div className="auth-card-icon" style={{ margin: '0 auto 16px', width: 52, height: 52, fontSize: 22 }}>
          <i className="fa-solid fa-envelope-circle-check" />
        </div>
        <h1 style={{ marginBottom: 8 }}>Revisa tu correo</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 4 }}>
          {email ? (
            <>
              Enviamos un enlace de confirmacion a <strong>{email}</strong>. Abrelo para activar tu cuenta.
            </>
          ) : (
            'Enviamos un enlace de confirmacion a tu correo. Abrelo para activar tu cuenta.'
          )}
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>El enlace vence en 24 horas.</p>

        {email && (
          <button type="button" className="auth-submit" onClick={handleResend} disabled={sending || sent} style={{ marginTop: 12 }}>
            {sent ? 'Correo reenviado' : sending ? 'Enviando...' : 'Reenviar correo'}
          </button>
        )}

        <p className="auth-footer">
          <Link to="/login">Volver a inicio de sesion</Link>
        </p>
      </div>
    </AuthLayout>
  )
}
