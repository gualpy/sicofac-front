import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listCompanies, type Company } from '../api/companies'
import { useCompany } from '../company/CompanyContext'

/**
 * Resolves which company the logged-in user should land on. The product
 * enforces one company per account, so this almost always auto-selects
 * the single result and redirects without rendering anything. The visible
 * list only shows up for the rare edge case of an account with more than
 * one company (admin-provisioned) or none yet (contact-admin message).
 */
export function CompanyPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { selectCompany } = useCompany()
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    listCompanies()
      .then((result) => {
        if (result.length === 1) {
          selectCompany(result[0])
          navigate('/')
          return
        }

        setCompanies(result)
      })
      .catch(() => setError('No se pudo cargar tu empresa.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSelect(company: Company) {
    selectCompany(company)
    navigate('/')
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Empresas</h1>
      </div>

      {error && <p role="alert">{error}</p>}

      {loading ? (
        <p>Cargando...</p>
      ) : companies.length === 0 ? (
        <p>No tenes ninguna empresa asignada. Contacta al administrador.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Razon social</th>
              <th>RUC</th>
              <th>Ambiente</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {companies.map((company) => (
              <tr key={company.id}>
                <td>{company.name}</td>
                <td>{company.ruc}</td>
                <td>{company.environment}</td>
                <td>
                  <button type="button" onClick={() => handleSelect(company)}>
                    Entrar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
