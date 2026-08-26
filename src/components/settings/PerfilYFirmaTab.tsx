import { useEffect, useState, type FormEvent } from 'react'
import {
  updateCompanyProfile,
  fetchLogoBlobUrl,
  uploadLogo,
  deleteLogo,
  getCertificate,
  uploadCertificate,
  activateCertificate,
  type Company,
  type CertificateInfo,
} from '../../api/companies'
import { useCompany } from '../../company/CompanyContext'

type Props = {
  company: Company
}

export function PerfilYFirmaTab({ company }: Props) {
  const { selectCompany } = useCompany()
  const [logoSrc, setLogoSrc] = useState<string | null>(null)
  const [certificate, setCertificate] = useState<CertificateInfo>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    fetchLogoBlobUrl(company.id).then(setLogoSrc)
    getCertificate(company.id).then(setCertificate)
  }, [company.id])

  async function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setError(null)
    try {
      await uploadLogo(company.id, file)
      const src = await fetchLogoBlobUrl(company.id)
      setLogoSrc(src)
    } catch {
      setError('No se pudo subir el logo. Revisa que sea .jpg/.png, menor a 100KB y 200x200px.')
    }
  }

  async function handleLogoDelete() {
    setError(null)
    try {
      await deleteLogo(company.id)
      setLogoSrc(null)
    } catch {
      setError('No se pudo eliminar el logo.')
    }
  }

  async function handleCertificateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const form = new FormData(event.currentTarget)
    const file = form.get('certificate') as File
    const password = String(form.get('certificate_password') || '')

    if (!file || file.size === 0) {
      setError('Selecciona el archivo del certificado.')
      return
    }

    try {
      const result = await uploadCertificate(company.id, file, password)
      await activateCertificate(company.id, result.version)
      const info = await getCertificate(company.id)
      setCertificate(info)
      setMessage('Certificado cargado y activado.')
      event.currentTarget.reset()
    } catch {
      setError('No se pudo cargar el certificado. Revisa el archivo .p12/.pfx y la contrasena.')
    }
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSavingProfile(true)
    const form = new FormData(event.currentTarget)

    try {
      const updated = await updateCompanyProfile(company.id, {
        name: String(form.get('name') || company.name),
        trade_name: String(form.get('trade_name') || '') || undefined,
        address: String(form.get('address') || '') || undefined,
        phone: String(form.get('phone') || '') || undefined,
        email: String(form.get('email') || '') || undefined,
        is_rimpe: form.get('is_rimpe') === 'on',
        is_special_taxpayer: form.get('is_special_taxpayer') === 'on',
        is_popular_business: form.get('is_popular_business') === 'on',
        requires_accounting: form.get('requires_accounting') === 'on',
      })
      selectCompany(updated)
      setMessage('Perfil guardado.')
    } catch {
      setError('No se pudo guardar el perfil.')
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <div className="card" style={{ maxWidth: 700 }}>
      <h2>Logo emisor</h2>
      {error && <p role="alert">{error}</p>}
      {message && <p style={{ color: 'var(--success)', fontSize: 13 }}>{message}</p>}

      {logoSrc && <img src={logoSrc} alt="Logo" style={{ maxWidth: 200, maxHeight: 200 }} />}
      <p style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--table-header-bg)', padding: 10, borderRadius: 6 }}>
        La imagen debe tener las siguientes caracteristicas: tamano maximo 100 KB, extension .jpg o .png y ser menor a 200px por 200px.
      </p>
      <div className="form-row">
        <label>
          Buscar archivo
          <input type="file" accept="image/png,image/jpeg" onChange={handleLogoChange} />
        </label>
        {logoSrc && (
          <button type="button" className="danger" onClick={handleLogoDelete} style={{ alignSelf: 'flex-end' }}>
            <i className="fa-solid fa-trash" /> Eliminar logo
          </button>
        )}
      </div>

      <h2 style={{ marginTop: 20 }}>Firma electronica</h2>
      <form onSubmit={handleCertificateSubmit}>
        <div className="form-row">
          <label>
            Tipo firma
            <select disabled defaultValue="archivo">
              <option value="archivo">Archivo</option>
            </select>
          </label>
          <label>
            Certificado (.p12/.pfx)
            <input type="file" name="certificate" accept=".p12,.pfx" />
          </label>
        </div>
        <label>
          Contrasena del certificado
          <input type="password" name="certificate_password" />
        </label>
        <button type="submit" className="primary" style={{ alignSelf: 'flex-start' }}>
          <i className="fa-solid fa-upload" /> Cargar certificado
        </button>
      </form>

      {certificate && (
        <div style={{ marginTop: 10, fontSize: 13 }}>
          <p>
            <strong>Estado:</strong> <span className={`badge ${certificate.is_active ? 'authorized' : 'draft'}`}>{certificate.status}</span>
          </p>
          {certificate.expires_at && (
            <p>
              <strong>Fecha de vigencia:</strong>{' '}
              {new Intl.DateTimeFormat('es-EC').format(new Date(certificate.expires_at))}
            </p>
          )}
          {certificate.subject && (
            <p>
              <strong>Propietario certificado:</strong> {certificate.subject}
            </p>
          )}
        </div>
      )}

      <h2 style={{ marginTop: 20 }}>Datos del contribuyente</h2>
      <form onSubmit={handleProfileSubmit}>
        <div className="form-row">
          <label>
            Razon social
            <input name="name" defaultValue={company.name} required />
          </label>
          <label>
            Nombre comercial
            <input name="trade_name" defaultValue={company.trade_name ?? ''} />
          </label>
        </div>
        <div className="form-row">
          <label>
            Direccion
            <input name="address" defaultValue={company.address ?? ''} />
          </label>
          <label>
            Telefono
            <input name="phone" defaultValue={company.phone ?? ''} />
          </label>
        </div>
        <label>
          Email
          <input type="email" name="email" defaultValue={company.email ?? ''} />
        </label>

        <div className="form-row">
          <label className="checkbox-label">
            <input type="checkbox" name="is_rimpe" defaultChecked={company.is_rimpe} /> Contribuyente RIMPE
          </label>
          <label className="checkbox-label">
            <input type="checkbox" name="is_special_taxpayer" defaultChecked={company.is_special_taxpayer} /> Contribuyente
            especial
          </label>
        </div>
        <div className="form-row">
          <label className="checkbox-label">
            <input type="checkbox" name="is_popular_business" defaultChecked={company.is_popular_business} /> Negocio popular
          </label>
          <label className="checkbox-label">
            <input type="checkbox" name="requires_accounting" defaultChecked={company.requires_accounting} /> Obligado a
            llevar contabilidad
          </label>
        </div>

        <button type="submit" className="primary" disabled={savingProfile} style={{ alignSelf: 'flex-start' }}>
          <i className="fa-solid fa-floppy-disk" /> {savingProfile ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </div>
  )
}
