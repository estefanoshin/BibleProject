import { useState } from 'react'
import { PageHeader, StatusMessage } from '../components/PageHeader.jsx'
import { deletePassageNote, deleteSavedPassage, usePassageStorage } from '../passageStorage'
import { rememberVerseAnchor } from '../readerScroll'
import { navigate } from '../router'
import { useUiLanguage } from '../uiLanguage'
import { t } from '../uiStrings'
import { displayVersionName } from '../versionMeta'

function openItem(item) {
  const verse = item.verses?.[0]?.verseNumber
  if (verse != null) {
    rememberVerseAnchor(verse)
  }
  if (item.chapterId) {
    navigate(`/chapters/${item.chapterId}`)
  }
}

function formatSavedAt(value, lang) {
  try {
    return new Date(value).toLocaleString(lang)
  } catch {
    return value
  }
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path
        d="M4.5 6.5h11M8 6.5V4.8h4v1.7M6.2 6.5l.6 9.2h6.4l.6-9.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SavedList({ items, lang, preview, confirmKey, onDelete }) {
  const [pending, setPending] = useState(null)

  return (
    <>
      <ul className="card-list saved-list">
        {items.map((item) => (
          <li key={item.id} className="saved-item">
            <button type="button" className="card saved-card" onClick={() => openItem(item)}>
              <span>
                <strong>{item.reference}</strong>
                <span className="saved-meta">
                  {displayVersionName(item.version)} · {formatSavedAt(item.savedAt, lang)}
                </span>
                <span className="saved-note-text">{preview(item)}</span>
              </span>
            </button>
            <button
              type="button"
              className="saved-delete"
              title={t(lang, 'delete')}
              aria-label={t(lang, 'delete')}
              onClick={() => setPending(item)}
            >
              <TrashIcon />
            </button>
          </li>
        ))}
      </ul>
      {pending ? (
        <DeleteConfirmDialog
          lang={lang}
          title={t(lang, confirmKey)}
          reference={pending.reference}
          onCancel={() => setPending(null)}
          onConfirm={() => {
            onDelete(pending.id)
            setPending(null)
          }}
        />
      ) : null}
    </>
  )
}

function DeleteConfirmDialog({ lang, title, reference, onCancel, onConfirm }) {
  return (
    <div className="note-dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        className="note-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="note-dialog-header">
          <h2 id="delete-dialog-title">{title}</h2>
          <button
            type="button"
            className="note-dialog-close"
            onClick={onCancel}
            title={t(lang, 'close')}
            aria-label={t(lang, 'close')}
          >
            ×
          </button>
        </div>
        <p>{reference}</p>
        <p>{t(lang, 'deleteConfirm')}</p>
        <div className="note-dialog-actions">
          <button type="button" onClick={onCancel}>{t(lang, 'cancel')}</button>
          <button type="button" className="danger" onClick={onConfirm}>
            {t(lang, 'delete')}
          </button>
        </div>
      </section>
    </div>
  )
}

export function SavedNotesPage() {
  const lang = useUiLanguage()
  const { passageNotes: notes } = usePassageStorage()

  return (
    <section className="page">
      <PageHeader title={t(lang, 'savedNotes')} backTo="#/" lang={lang} />
      <StatusMessage empty={notes.length === 0} lang={lang} />
      {notes.length > 0 ? (
        <SavedList
          items={notes}
          lang={lang}
          preview={(item) => item.note}
          confirmKey="deleteNoteConfirmTitle"
          onDelete={deletePassageNote}
        />
      ) : null}
    </section>
  )
}

export function SavedPassagesPage() {
  const lang = useUiLanguage()
  const { savedPassages: passages } = usePassageStorage()

  return (
    <section className="page">
      <PageHeader title={t(lang, 'savedPassages')} backTo="#/" lang={lang} />
      <StatusMessage empty={passages.length === 0} lang={lang} />
      {passages.length > 0 ? (
        <SavedList
          items={passages}
          lang={lang}
          preview={(item) => item.verses.map((verse) => `${verse.verseNumber} ${verse.text}`).join(' ')}
          confirmKey="deletePassageConfirmTitle"
          onDelete={deleteSavedPassage}
        />
      ) : null}
    </section>
  )
}
