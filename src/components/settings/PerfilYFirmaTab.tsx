import { useEffect, useState, type FormEvent } from 'react'
import toast from 'react-hot-toast'
import {
  updateCompanyProfile,
  fetchLogoBlobUrl,
  uploadLogo,
  deleteLogo,
  getCertificate,
  uploadCertificate,
  activateCertificate,
  listCompanies,
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
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    fetchLogoBlobUrl(company.id).then(setLogoSrc)
    getCertificate(company.id).then(setCertificate)
  }, [company.id])

  async function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      await uploadLogo(company.id, file)
      const src = await fetchLogoBlobUrl(company.id)
      setLogoSrc(src)
    } catch {
      toast.error('No se pudo subir el logo. Revisa que sea .jpg/.png y menor a 2MB.')
    }
  }

  async function handleLogoDelete() {
    try {
      await deleteLogo(company.id)
      setLogoSrc(null)
    } catch {
      toast.error('No se pudo eliminar el logo.')
    }
  }

  async function handleCertificateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const file = form.get('certificate') as File
    const password = String(form.get('certificate_password') || '')

    if (!file || file.size === 0) {
      toast.error('Selecciona el archivo del certificado.')
      return
    }

    try {
      const result = await uploadCertificate(company.id, file, password)
      await activateCertificate(company.id, result.version)
      const info = await getCertificate(company.id)
      setCertificate(info)

      // The certificate may carry the holder's RUC/nombre/telefono (see
      // CompanyCertificateService::issuerFieldsFromCertificate on the
      // back) and sync them onto the company as a side effect of
      // activation -- refresh the shared company so this form's fields
      // (currently uncontrolled/defaultValue-based) pick up the new data.
      const companies = await listCompanies()
      const updated = companies.find((c) => c.id === company.id)
      if (updated) selectCompany(updated)

      toast.success('Certificado cargado y activado.')
      event.currentTarget.reset()
    } catch {
      toast.error('No se pudo cargar el certificado. Revisa el archivo .p12/.pfx y la contraseña.')
    }
  }

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavingProfile(true)
    const form = new FormData(event.currentTarget)

    try {
      const updated = await updateCompanyProfile(company.id, {
        name: String(form.get('name') || company.name),
        trade_name: String(form.get('trade_name') || '') || undefined,
        ruc: String(form.get('ruc') || company.ruc),
        address: String(form.get('address') || '') || undefined,
        phone: String(form.get('phone') || '') || undefined,
        email: String(form.get('email') || '') || undefined,
        is_rimpe: form.get('is_rimpe') === 'on',
        is_special_taxpayer: form.get('is_special_taxpayer') === 'on',
        is_popular_business: form.get('is_popular_business') === 'on',
        requires_accounting: form.get('requires_accounting') === 'on',
      })
      selectCompany(updated)
      toast.success('Perfil guardado.')
    } catch {
      toast.error('No se pudo guardar el perfil.')
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <div className="card" style={{ maxWidth: 700 }}>
      <div className="card" style={{ padding: 20, marginBottom: 20, border: '1px solid var(--border)', backgroundColor: '#fff' }}>
        <h2>Logo emisor</h2>

      {logoSrc && <img src={logoSrc} alt="Logo" style={{ maxWidth: 200, maxHeight: 200 }} />}
      <p style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--table-header-bg)', padding: 10, borderRadius: 6 }}>
        La imagen debe tener las siguientes caracteristicas: tamano maximo 2 MB, extension .jpg o .png.
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
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 20, border: '1px solid var(--border)', backgroundColor: '#fff' }}>
        <h2 style={{ marginTop: 20 }}>Firma electrónica</h2>
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
            Contraseña del certificado
            <input type="password" name="certificate_password" />
          </label>
          <button type="submit" className="primary" style={{ alignSelf: 'flex-start', marginTop: 10 }}>
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
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 20, border: '1px solid var(--border)', backgroundColor: '#fff' }}>
        <h2 style={{ marginTop: 20 }}>Datos del contribuyente</h2>
        <form key={`${company.ruc}-${company.name}-${company.phone}`} onSubmit={handleProfileSubmit}>
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
              RUC
              <input name="ruc" defaultValue={company.ruc} pattern="\d{10}001" title="13 digitos, debe terminar en 001" required />
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
          <button type="submit" className="primary" disabled={savingProfile} style={{ alignSelf: 'flex-start', marginTop: 10 }}>
            <i className="fa-solid fa-floppy-disk" /> {savingProfile ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      </div>
    </div>
  )
}
