import { SPANISH } from '../versionMeta'
import { t } from '../uiStrings'

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

// The sticky bar is a sibling of the header so it can stick for the whole page,
// not just for the height of the header block.
export function PageHeader({ title, subtitle, backTo, backLabel, actions, barActions, lang = SPANISH }) {
  return (
    <>
      <div className="back-bar">
        {backTo ? (
          <a className="back-button" href={backTo}>
            <BackIcon />
            <span>{backLabel ?? t(lang, 'back')}</span>
          </a>
        ) : (
          <span className="back-button placeholder" />
        )}
        {barActions ? <div className="back-bar-actions">{barActions}</div> : null}
      </div>
      <header className="page-header">
        <div className="page-header-row">
          <div>
            <h1>{title}</h1>
            {subtitle ? <p className="subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div className="page-header-actions">{actions}</div> : null}
        </div>
      </header>
    </>
  )
}

export function StatusMessage({ error, loading, empty, lang = SPANISH }) {
  if (loading) {
    return <p className="status">{t(lang, 'loading')}</p>
  }
  if (error) {
    return <p className="status error">{error}</p>
  }
  if (empty) {
    return <p className="status">{t(lang, 'empty')}</p>
  }
  return null
}
