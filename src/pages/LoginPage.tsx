import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const { login, resendVerification } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setNeedsVerification(false)
    setResent(false)
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
    <div className="auth-page">
      <form className="card narrow" onSubmit={handleSubmit}>
        <h1>SICOFAC</h1>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          Contrasena
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p role="alert">{error}</p>}
        {needsVerification && (
          <button type="button" onClick={handleResend} disabled={resending || resent}>
            {resent ? 'Correo reenviado' : resending ? 'Enviando...' : 'Reenviar correo de confirmacion'}
          </button>
        )}
        <button type="submit" className="primary">
          Ingresar
        </button>
        <p>
          No tenes cuenta? <Link to="/register">Registrate</Link>
        </p>
      </form>
    </div>
  )
}
