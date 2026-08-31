export function PageHeader({ title, subtitle, backTo, backLabel = 'Atrás' }) {
  return (
    <header className="page-header">
      {backTo ? (
        <a className="back-link" href={backTo}>
          {backLabel}
        </a>
      ) : (
        <span className="back-link placeholder" />
      )}
      <div>
        <h1>{title}</h1>
        {subtitle ? <p className="subtitle">{subtitle}</p> : null}
      </div>
    </header>
  )
}

export function StatusMessage({ error, loading, empty }) {
  if (loading) {
    return <p className="status">Cargando…</p>
  }
  if (error) {
    return <p className="status error">{error}</p>
  }
  if (empty) {
    return <p className="status">No hay contenido para mostrar.</p>
  }
  return null
}
