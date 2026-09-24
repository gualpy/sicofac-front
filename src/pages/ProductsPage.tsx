import { useEffect, useState, type FormEvent } from 'react'
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  deleteAllProducts,
  downloadProductsExport,
  TAX_CODE_LABELS,
  type Product,
  type TaxCode,
} from '../api/products'
import {
  listPosCategories,
  createPosCategory,
  deletePosCategory,
  type PosCategory,
} from '../api/posCategories'
import { useCompany } from '../company/CompanyContext'

export function ProductsPage() {
  const { company } = useCompany()
  const [products, setProducts] = useState<Product[]>([])
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [codeFilter, setCodeFilter] = useState('')
  const [nameFilter, setNameFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [busy, setBusy] = useState(false)
  const [posEnabledField, setPosEnabledField] = useState(false)

  const [categories, setCategories] = useState<PosCategory[]>([])
  const [showCategories, setShowCategories] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')

  useEffect(() => {
    if (company) refresh(company.id, 1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company])

  useEffect(() => {
    if (company) refreshCategories(company.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company])

  function refreshCategories(companyId: number) {
    listPosCategories(companyId).then(setCategories).catch(() => setCategories([]))
  }

  async function handleCreateCategory(event: FormEvent) {
    event.preventDefault()
    if (!company || !newCategoryName.trim()) return
    try {
      await createPosCategory(company.id, { name: newCategoryName.trim() })
      setNewCategoryName('')
      refreshCategories(company.id)
    } catch {
      setError('No se pudo crear la categoria. Puede que el nombre ya exista.')
    }
  }

  async function handleDeleteCategory(categoryId: number) {
    if (!company) return
    if (!confirm('Eliminar esta categoria de POS?')) return
    try {
      await deletePosCategory(company.id, categoryId)
      refreshCategories(company.id)
    } catch {
      setError('No se pudo eliminar la categoria (puede tener productos asignados).')
    }
  }

  function refresh(companyId: number, pageToLoad: number) {
    setLoading(true)
    listProducts(companyId, { code: codeFilter || undefined, name: nameFilter || undefined, page: pageToLoad })
      .then((result) => {
        setProducts(result.data)
        setPage(result.current_page)
        setLastPage(result.last_page)
        setTotal(result.total)
      })
      .catch(() => setError('No se pudo cargar los productos.'))
      .finally(() => setLoading(false))
  }

  function handleSearch(event: FormEvent) {
    event.preventDefault()
    if (company) refresh(company.id, 1)
  }

  function openCreateForm() {
    setEditingProduct(null)
    setPosEnabledField(false)
    setShowForm(true)
    setError(null)
  }

  function openEditForm(product: Product) {
    setEditingProduct(product)
    setPosEnabledField(product.pos_enabled)
    setShowForm(true)
    setError(null)
  }

  function closeForm() {
    setShowForm(false)
    setEditingProduct(null)
    setPosEnabledField(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!company) return
    setError(null)
    const form = new FormData(event.currentTarget)

    const posEnabled = form.get('pos_enabled') === 'on'

    const payload = {
      code: String(form.get('code')),
      auxiliary_code: String(form.get('auxiliary_code') || '') || undefined,
      name: String(form.get('name')),
      unit_price: Number(form.get('unit_price')),
      tax_rate: Number(form.get('tax_rate')),
      tax_code: form.get('tax_code') as TaxCode,
      ice_rate: Number(form.get('ice_rate') || 0),
      pos_enabled: posEnabled,
      pos_category_id: posEnabled && form.get('pos_category_id') ? Number(form.get('pos_category_id')) : undefined,
      pos_label: posEnabled ? String(form.get('pos_label') || '') || undefined : undefined,
      barcode: posEnabled ? String(form.get('barcode') || '') || undefined : undefined,
      pos_sort_order: posEnabled && form.get('pos_sort_order') ? Number(form.get('pos_sort_order')) : undefined,
    }

    try {
      if (editingProduct) {
        await updateProduct(company.id, editingProduct.id, payload)
      } else {
        await createProduct(company.id, payload)
      }
      closeForm()
      refresh(company.id, editingProduct ? page : 1)
    } catch {
      setError(
        editingProduct
          ? 'No se pudo actualizar el producto. Revisa que el codigo o el codigo de barras no esten repetidos.'
          : 'No se pudo crear el producto. Revisa que el codigo o el codigo de barras no esten repetidos.',
      )
    }
  }

  async function handleDelete(productId: number) {
    if (!company) return
    if (!confirm('Eliminar este producto?')) return
    try {
      await deleteProduct(company.id, productId)
      refresh(company.id, page)
    } catch {
      setError('No se pudo eliminar (puede estar referenciado por una factura).')
    }
  }

  async function handleDeleteAll() {
    if (!company) return
    if (!confirm('Esto elimina TODOS los productos que no esten usados en facturas. Continuar?')) return
    setBusy(true)
    try {
      const result = await deleteAllProducts(company.id)
      setError(
        result.skipped > 0
          ? `Se eliminaron ${result.deleted}. Se omitieron ${result.skipped} por estar referenciados en facturas.`
          : null,
      )
      refresh(company.id, 1)
    } catch {
      setError('No se pudo completar la eliminacion.')
    } finally {
      setBusy(false)
    }
  }

  if (!company) return null

  return (
    <div className="page">
      <div className="page-header">
        <h1>Mis productos y servicios</h1>
      </div>

      {error && <p role="alert">{error}</p>}

      <form className="card" onSubmit={handleSearch}>
        <div className="form-row">
          <label>
            Codigo
            <input value={codeFilter} onChange={(e) => setCodeFilter(e.target.value)} />
          </label>
          <label>
            Nombre
            <input value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} />
          </label>
        </div>
        <div className="invoice-actions-bar" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="primary"
              onClick={() => (showForm ? closeForm() : openCreateForm())}
            >
              <i className="fa-solid fa-plus" /> {showForm ? 'Cancelar' : 'Nuevo'}
            </button>
            <button type="button" className="danger" disabled={busy} onClick={handleDeleteAll}>
              <i className="fa-solid fa-trash" /> Eliminar todos los productos
            </button>
          </div>
          <button type="submit">
            <i className="fa-solid fa-magnifying-glass" /> Buscar
          </button>
        </div>
      </form>

      {showForm && (
        <form className="card" onSubmit={handleSubmit} key={editingProduct?.id ?? 'new'}>
          <div className="form-row">
            <label>
              Codigo principal
              <input name="code" defaultValue={editingProduct?.code ?? ''} required maxLength={50} />
            </label>
            <label>
              Codigo auxiliar
              <input name="auxiliary_code" defaultValue={editingProduct?.auxiliary_code ?? ''} maxLength={50} />
            </label>
          </div>
          <label>
            Nombre
            <input name="name" defaultValue={editingProduct?.name ?? ''} required />
          </label>
          <div className="form-row">
            <label>
              Precio unitario
              <input
                name="unit_price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={editingProduct?.unit_price ?? undefined}
                required
              />
            </label>
            <label>
              Tarifa IVA
              <select name="tax_code" defaultValue={editingProduct?.tax_code ?? '15'}>
                {Object.entries(TAX_CODE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-row">
            <label>
              IVA %
              <input
                name="tax_rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                defaultValue={editingProduct?.tax_rate ?? 15}
                required
              />
            </label>
            <label>
              ICE %
              <input
                name="ice_rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                defaultValue={editingProduct?.ice_rate ?? 0}
              />
            </label>
          </div>

          <span className="section-label">Punto de venta</span>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="pos_enabled"
              checked={posEnabledField}
              onChange={(e) => setPosEnabledField(e.target.checked)}
            />
            Mostrar en Punto de venta
          </label>

          {posEnabledField && (
            <div className="form-row">
              <label>
                Categoria
                <select name="pos_category_id" defaultValue={editingProduct?.pos_category_id ?? ''}>
                  <option value="">Sin categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Nombre corto (POS)
                <input
                  name="pos_label"
                  defaultValue={editingProduct?.pos_label ?? ''}
                  maxLength={255}
                  placeholder="Si esta vacio, usa el nombre normal"
                />
              </label>
              <label>
                Codigo de barras
                <input name="barcode" defaultValue={editingProduct?.barcode ?? ''} maxLength={100} />
              </label>
              <label>
                Orden
                <input
                  name="pos_sort_order"
                  type="number"
                  min="0"
                  defaultValue={editingProduct?.pos_sort_order ?? 0}
                />
              </label>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="primary">
              {editingProduct ? 'Guardar cambios' : 'Crear'}
            </button>
            {editingProduct && (
              <button type="button" onClick={closeForm}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <button type="button" onClick={() => setShowCategories((v) => !v)}>
          <i className="fa-solid fa-tags" /> {showCategories ? 'Ocultar categorias POS' : 'Categorias POS'}
        </button>
        {showCategories && (
          <div style={{ marginTop: 12 }}>
            <form className="form-row" onSubmit={handleCreateCategory} style={{ marginBottom: 12 }}>
              <label>
                Nueva categoria
                <input
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ej: Helados"
                />
              </label>
              <button type="submit" className="primary" style={{ alignSelf: 'flex-end' }}>
                <i className="fa-solid fa-plus" /> Agregar
              </button>
            </form>
            {categories.length === 0 ? (
              <p className="muted-inline">Aun no tienes categorias de POS.</p>
            ) : (
              <ul className="pos-category-manager-list">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <span>{cat.name}</span>
                    <button type="button" className="icon-btn delete" onClick={() => handleDeleteCategory(cat.id)}>
                      <i className="fa-solid fa-trash" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <span className="section-label">Lista de productos ({total})</span>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Codigo principal</th>
                  <th>Codigo auxiliar</th>
                  <th>Nombre</th>
                  <th>Valor</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.code}</td>
                    <td>{product.auxiliary_code ?? '-'}</td>
                    <td>
                      {product.name}
                      {product.pos_enabled && <span className="badge pos-badge">POS</span>}
                    </td>
                    <td>${product.unit_price}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          type="button"
                          className="icon-btn"
                          title="Editar producto"
                          aria-label="Editar producto"
                          onClick={() => openEditForm(product)}
                        >
                          <i className="fa-solid fa-pen" />
                        </button>
                        <button
                          type="button"
                          className="icon-btn delete"
                          title="Eliminar producto"
                          aria-label="Eliminar producto"
                          onClick={() => handleDelete(product.id)}
                        >
                          <i className="fa-solid fa-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={5}>No hay productos todavia.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {lastPage > 1 && (
            <div className="invoice-actions-bar" style={{ justifyContent: 'center' }}>
              <button type="button" disabled={page <= 1} onClick={() => company && refresh(company.id, page - 1)}>
                <i className="fa-solid fa-chevron-left" />
              </button>
              <span style={{ alignSelf: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                {page} de {lastPage}
              </span>
              <button
                type="button"
                disabled={page >= lastPage}
                onClick={() => company && refresh(company.id, page + 1)}
              >
                <i className="fa-solid fa-chevron-right" />
              </button>
            </div>
          )}

          <p>
            <a href="#" onClick={(e) => { e.preventDefault(); downloadProductsExport(company.id) }}>
              <i className="fa-solid fa-download" /> Descargar reporte
            </a>
          </p>
        </>
      )}
    </div>
  )
}
