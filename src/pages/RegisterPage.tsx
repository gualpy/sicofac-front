import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { useAuth } from '../auth/AuthContext'
import { listPlans, type Plan } from '../api/plans'
import { AuthLayout } from '../components/auth/AuthLayout'
import { AuthField } from '../components/auth/AuthField'
import { formatPlanPrice as formatPrice, formatPlanCount as formatCount } from '../utils/plan'

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
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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

    if (!termsAccepted) {
      setError('Tenes que aceptar los terminos y la politica de privacidad.')
      return
    }

    setSubmitting(true)
    try {
      await register({
        name,
        email,
        password,
        company_name: companyName,
        company_ruc: companyRuc,
        company_environment: companyEnvironment,
        plan_id: planId,
        terms_accepted: termsAccepted,
      })
      navigate('/check-email', { state: { email } })
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 422) {
        const firstError = Object.values(err.response.data?.errors ?? {})[0] as string[] | undefined
        setError(firstError?.[0] ?? 'Revisa los datos ingresados.')
        return
      }
      setError('No se pudo registrar. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      headlineTop="Empeza a"
      headlineAccent="facturar hoy."
      subtitle="Crea tu cuenta en minutos y emiti tu primera factura electronica sin instalar nada. Firma, SRI y POS incluidos desde el plan inicial."
    >
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="auth-card-header">
          <span className="auth-card-icon">
            <i className="fa-solid fa-user-plus" />
          </span>
          <div>
            <h1>Crear cuenta</h1>
            <p>Completa tus datos para empezar</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <AuthField label="Tu nombre" icon="fa-user" value={name} onChange={setName} placeholder="Nombre y apellido" required autoComplete="name" />
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

          <div className="auth-field-row">
            <AuthField
              label="Contrasena"
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
          </div>

          <div className="auth-divider" />

          <AuthField label="Nombre de tu empresa" icon="fa-building" value={companyName} onChange={setCompanyName} placeholder="Razon social" required />
          <AuthField
            label="RUC (13 digitos)"
            icon="fa-id-card"
            value={companyRuc}
            onChange={setCompanyRuc}
            placeholder="0999999999001"
            maxLength={13}
            minLength={13}
            required
          />

          <label className="auth-field">
            <span className="auth-field-top">
              <span className="auth-field-label">Ambiente</span>
            </span>
            <span className="auth-field-input">
              <i className="fa-solid fa-flask" />
              <select
                value={companyEnvironment}
                onChange={(e) => setCompanyEnvironment(e.target.value as 'test' | 'production')}
                style={{ paddingLeft: 36, width: '100%' }}
              >
                <option value="test">Pruebas</option>
                <option value="production">Produccion</option>
              </select>
            </span>
          </label>

          <div className="auth-divider" />

          <div className="plan-picker">
            <span className="auth-field-label">Elegi tu plan</span>
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

          <label className="auth-checkbox-row">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              required
            />
            <span>
              Acepto los{' '}
              <a href="/terminos" target="_blank" rel="noopener noreferrer">
                Terminos de Servicio
              </a>{' '}
              y la{' '}
              <a href="/privacidad" target="_blank" rel="noopener noreferrer">
                Politica de Privacidad
              </a>
              .
            </span>
          </label>

          {error && <p role="alert">{error}</p>}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
            <i className="fa-solid fa-arrow-right" />
          </button>
        </form>

        <p className="auth-footer">
          Ya tenes cuenta? <Link to="/login">Ingresa aqui</Link>
        </p>
      </div>
    </AuthLayout>
  )
}
