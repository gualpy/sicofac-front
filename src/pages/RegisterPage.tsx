import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { useAuth } from '../auth/AuthContext'
import { useCompany } from '../company/CompanyContext'

export function RegisterPage() {
  const { register } = useAuth()
  const { selectCompany } = useCompany()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyRuc, setCompanyRuc] = useState('')
  const [companyEnvironment, setCompanyEnvironment] = useState<'test' | 'production'>('test')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (password !== passwordConfirmation) {
      setError('Las contrasenas no coinciden.')
      return
    }

    try {
      const company = await register({
        name,
        email,
        password,
        company_name: companyName,
        company_ruc: companyRuc,
        company_environment: companyEnvironment,
      })
      selectCompany(company)
      navigate('/')
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 422) {
        const firstError = Object.values(err.response.data?.errors ?? {})[0] as string[] | undefined
        setError(firstError?.[0] ?? 'Revisa los datos ingresados.')
        return
      }
      setError('No se pudo registrar. Intenta de nuevo.')
    }
  }

  return (
    <div className="auth-page">
      <form className="card narrow" onSubmit={handleSubmit}>
        <h1>Crear tu facturador</h1>

        <label>
          Tu nombre
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
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
            minLength={8}
            required
          />
        </label>
        <label>
          Confirmar contrasena
          <input
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            minLength={8}
            required
          />
        </label>

        <hr />

        <label>
          Nombre de tu empresa
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
        </label>
        <label>
          RUC (13 digitos)
          <input
            value={companyRuc}
            onChange={(e) => setCompanyRuc(e.target.value)}
            maxLength={13}
            minLength={13}
            required
          />
        </label>
        <label>
          Ambiente
          <select
            value={companyEnvironment}
            onChange={(e) => setCompanyEnvironment(e.target.value as 'test' | 'production')}
          >
            <option value="test">Pruebas</option>
            <option value="production">Produccion</option>
          </select>
        </label>

        {error && <p role="alert">{error}</p>}
        <button type="submit" className="primary">
          Registrarme
        </button>
        <p>
          Ya tenes cuenta? <Link to="/login">Ingresa aqui</Link>
        </p>
      </form>
    </div>
  )
}
