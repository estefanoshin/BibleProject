import { SPANISH } from '../versionMeta'
import { goBack, useRoute } from '../router'
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

function NotesIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M4 3.5h12v11.5H7.2L4 17.5z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M7 7.5h6M7 10.5h4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function BookmarkIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M5 3.5h10v13l-5-3.2-5 3.2z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  )
}

// The bar sticks for the whole page, so the title travels with it instead of
// living in a separate header block.
export function PageHeader({
  title,
  subtitle,
  backTo,
  backLabel,
  onBack,
  barActions,
  titleActions,
  lang = SPANISH,
}) {
  const route = useRoute()

  function handleLibrary(event, name) {
    if (route.name === name) {
      event.preventDefault()
      goBack()
    }
  }

  const backControl = onBack ? (
    <button type="button" className="back-button" onClick={onBack}>
      <BackIcon />
      <span>{backLabel ?? t(lang, 'back')}</span>
    </button>
  ) : backTo ? (
    <a className="back-button" href={backTo}>
      <BackIcon />
      <span>{backLabel ?? t(lang, 'back')}</span>
    </a>
  ) : null

  const titleBlock = (
    <div className="back-bar-title">
      <h1>{title}</h1>
      {subtitle ? <p className="subtitle">{subtitle}</p> : null}
    </div>
  )
  // Without a back button or title toggles there is nothing to fill a second
  // row, so the title shares the line with the library buttons instead.
  const inlineTitle = !backControl && !titleActions

  return (
    <header className="back-bar">
      <div className={inlineTitle ? 'back-bar-nav centered-title' : 'back-bar-nav'}>
        {backControl}
        {inlineTitle ? titleBlock : null}
        <div className="back-bar-actions">
          {barActions}
          <a
            className="select-toggle"
            href="#/notes"
            title={t(lang, 'savedNotes')}
            aria-label={t(lang, 'savedNotes')}
            aria-current={route.name === 'notes' ? 'page' : undefined}
            onClick={(event) => handleLibrary(event, 'notes')}
          >
            <NotesIcon />
          </a>
          <a
            className="select-toggle"
            href="#/saved"
            title={t(lang, 'savedPassages')}
            aria-label={t(lang, 'savedPassages')}
            aria-current={route.name === 'saved' ? 'page' : undefined}
            onClick={(event) => handleLibrary(event, 'saved')}
          >
            <BookmarkIcon />
          </a>
        </div>
      </div>
      {inlineTitle ? null : (
        <div className="back-bar-heading">
          {titleBlock}
          {titleActions ? <div className="back-bar-title-actions">{titleActions}</div> : null}
        </div>
      )}
    </header>
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
