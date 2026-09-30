import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

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
    <div className="auth-page">
      <div className="card narrow" style={{ textAlign: 'center' }}>
        <i className="fa-solid fa-envelope-circle-check" style={{ fontSize: 40, color: 'var(--accent)' }} />
        <h1>Revisa tu correo</h1>
        <p className="muted-inline">
          {email ? (
            <>
              Enviamos un enlace de confirmacion a <strong>{email}</strong>. Ábrelo para activar tu cuenta.
            </>
          ) : (
            'Enviamos un enlace de confirmacion a tu correo. Ábrelo para activar tu cuenta.'
          )}
        </p>
        <p className="muted-inline">El enlace vence en 24 horas.</p>

        {email && (
          <button type="button" onClick={handleResend} disabled={sending || sent} style={{ marginTop: 12 }}>
            {sent ? 'Correo reenviado' : sending ? 'Enviando...' : 'Reenviar correo'}
          </button>
        )}

        <p style={{ marginTop: 16 }}>
          <Link to="/login">Volver a inicio de sesion</Link>
        </p>
      </div>
    </div>
  )
}
