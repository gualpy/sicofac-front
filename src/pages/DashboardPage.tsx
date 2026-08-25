import { Navigate } from 'react-router-dom'
import { useCompany } from '../company/CompanyContext'

export function DashboardPage() {
  const { company } = useCompany()

  if (!company) {
    return <Navigate to="/company" replace />
  }

  return (
    <div className="page">
      <h1>{company.name}</h1>
      <p>RUC: {company.ruc}</p>
      <p>Ambiente: {company.environment}</p>
    </div>
  )
}
