function BackIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path
        d="M12.3 4.3 6.6 10l5.7 5.7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function PageHeader({ title, subtitle, backTo, backLabel = 'Atrás', actions }) {
  return (
    <header className="page-header">
      {backTo ? (
        <a className="back-button" href={backTo}>
          <BackIcon />
          <span>{backLabel}</span>
        </a>
      ) : (
        <span className="back-button placeholder" />
      )}
      <div className="page-header-row">
        <div>
          <h1>{title}</h1>
          {subtitle ? <p className="subtitle">{subtitle}</p> : null}
        </div>
        {actions ? <div className="page-header-actions">{actions}</div> : null}
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
