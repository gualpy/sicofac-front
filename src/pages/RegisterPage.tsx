import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { useAuth } from '../auth/AuthContext'
import { listPlans, type Plan } from '../api/plans'

function formatPrice(priceCents: number): string {
  return `$${(priceCents / 100).toFixed(2)}/año`
}

function formatCount(value: number | null, singular: string, plural: string): string {
  if (value === null) return `${plural} ilimitados`
  return `${value} ${value === 1 ? singular : plural}`
}

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyRuc, setCompanyRuc] = useState('')
  const [companyEnvironment, setCompanyEnvironment] = useState<'test' | 'production'>('test')
  const [plans, setPlans] = useState<Plan[]>([])
  const [planId, setPlanId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listPlans()
      .then((result) => {
        setPlans(result)
        setPlanId((current) => current ?? result[0]?.id ?? null)
      })
      .catch(() => setError('No se pudieron cargar los planes.'))
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (password !== passwordConfirmation) {
      setError('Las contrasenas no coinciden.')
      return
    }

    if (!planId) {
      setError('Elegi un plan.')
      return
    }

    try {
      await register({
        name,
        email,
        password,
        company_name: companyName,
        company_ruc: companyRuc,
        company_environment: companyEnvironment,
        plan_id: planId,
      })
      navigate('/check-email', { state: { email } })
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
      <form className="card" style={{ width: '100%', maxWidth: 520 }} onSubmit={handleSubmit}>
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
          Contraseña
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

        <hr />

        <div className="plan-picker">
          <span className="section-label">Elegi tu plan</span>
          <div className="plan-picker-grid">
            {plans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                className={plan.id === planId ? 'plan-card selected' : 'plan-card'}
                onClick={() => setPlanId(plan.id)}
              >
                <strong>{plan.name}</strong>
                <span className="plan-price">{formatPrice(plan.price_cents)}</span>
                <span className="plan-limit">{formatCount(plan.monthly_document_limit, 'documento/mes', 'documentos/mes')}</span>
                <span className="plan-limit">{formatCount(plan.max_establishments, 'establecimiento', 'establecimientos')}</span>
                <span className="plan-limit">{formatCount(plan.max_users, 'usuario', 'usuarios')}</span>
              </button>
            ))}
          </div>
        </div>

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
