import { useEffect, useRef, useState } from 'react'
import { chapterIdInVersion } from '../chapterIdentity'
import { copyText, hasTextSelection } from '../clipboard'
import { PageHeader, StatusMessage } from '../components/PageHeader.jsx'
import { deletePassageNote, deleteSavedPassage, usePassageStorage } from '../passageStorage'
import { rememberVerseAnchor } from '../readerScroll'
import { goBack, navigate } from '../router'
import { useUiLanguage } from '../uiLanguage'
import { t } from '../uiStrings'
import { displayVersionName } from '../versionMeta'

const LONG_PRESS_MS = 500
const LONG_PRESS_SLOP = 10
const MESSAGE_MS = 2200

function formatSavedAt(value, lang) {
  try {
    return new Date(value).toLocaleString(lang)
  } catch {
    return value
  }
}

// A press that stays put for LONG_PRESS_MS copies; moving past the slop means
// the user is dragging out a text selection or scrolling instead.
function useLongPress(onLongPress) {
  const press = useRef({ timer: 0, x: 0, y: 0, fired: false })

  function cancel() {
    window.clearTimeout(press.current.timer)
    press.current.timer = 0
  }

  useEffect(() => () => window.clearTimeout(press.current.timer), [])

  return {
    fired: () => press.current.fired,
    handlers: {
      onPointerDown(event) {
        if (event.pointerType === 'mouse' && event.button !== 0) {
          return
        }
        cancel()
        press.current.fired = false
        press.current.x = event.clientX
        press.current.y = event.clientY
        press.current.timer = window.setTimeout(() => {
          press.current.timer = 0
          press.current.fired = true
          onLongPress()
        }, LONG_PRESS_MS)
      },
      onPointerMove(event) {
        if (!press.current.timer) {
          return
        }
        const moved =
          Math.abs(event.clientX - press.current.x) > LONG_PRESS_SLOP ||
          Math.abs(event.clientY - press.current.y) > LONG_PRESS_SLOP
        if (moved) {
          cancel()
        }
      },
      onPointerUp: cancel,
      onPointerCancel: cancel,
    },
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

function CopyIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path
        d="M7.5 7.5h8v9h-8zM4.5 12.5h-1v-9h9v1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SavedItem({ item, lang, lines, onCopy, onDelete, onOpen }) {
  const longPress = useLongPress(onCopy)

  function handleClick() {
    if (longPress.fired() || hasTextSelection()) {
      return
    }
    onOpen()
  }

  return (
    <li className="saved-item">
      <button
        type="button"
        className="card saved-card"
        onClick={handleClick}
        {...longPress.handlers}
      >
        <span>
          <strong>{item.reference}</strong>
          <span className="saved-meta">
            {displayVersionName(item.version)} · {formatSavedAt(item.savedAt, lang)}
          </span>
          <span className="saved-note-text">{lines.join(' ')}</span>
        </span>
      </button>
      <button
        type="button"
        className="saved-action saved-copy"
        title={t(lang, 'copyPassage')}
        aria-label={t(lang, 'copyPassage')}
        onClick={onCopy}
      >
        <CopyIcon />
      </button>
      <button
        type="button"
        className="saved-action saved-delete"
        title={t(lang, 'delete')}
        aria-label={t(lang, 'delete')}
        onClick={onDelete}
      >
        <TrashIcon />
      </button>
    </li>
  )
}

function SavedList({ items, lang, lines, confirmKey, onDelete }) {
  const [pending, setPending] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!message) {
      return undefined
    }
    const timeout = window.setTimeout(() => setMessage(''), MESSAGE_MS)
    return () => window.clearTimeout(timeout)
  }, [message])

  async function copyItem(item) {
    const body = lines(item).join('\n')
    const copied = await copyText(`${item.reference} (${displayVersionName(item.version)})\n${body}`)
    setMessage(t(lang, copied ? 'passageCopied' : 'copyError'))
  }

  // Entries saved before chapterId was stored still resolve through the
  // canonical book id and chapter number.
  async function openItem(item) {
    const chapterId =
      item.chapterId ??
      (await chapterIdInVersion(item.version, item.canonicalBookId, item.chapterNumber))
    if (!chapterId) {
      setMessage(t(lang, 'chapterError'))
      return
    }
    rememberVerseAnchor(item.verses?.[0]?.verseNumber)
    navigate(`/chapters/${chapterId}`)
  }

  return (
    <>
      <ul className="card-list saved-list">
        {items.map((item) => (
          <SavedItem
            key={item.id}
            item={item}
            lang={lang}
            lines={lines(item)}
            onCopy={() => copyItem(item)}
            onDelete={() => setPending(item)}
            onOpen={() => openItem(item)}
          />
        ))}
      </ul>
      {message ? (
        <p className="saved-toast" role="status">
          {message}
        </p>
      ) : null}
      {pending ? (
        <DeleteConfirmDialog
          lang={lang}
          title={t(lang, confirmKey)}
          reference={pending.reference}
          onCancel={() => setPending(null)}
          onConfirm={async () => {
            await onDelete(pending.id)
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
      <PageHeader title={t(lang, 'savedNotes')} onBack={goBack} lang={lang} />
      <StatusMessage empty={notes.length === 0} lang={lang} />
      {notes.length > 0 ? (
        <SavedList
          items={notes}
          lang={lang}
          lines={(item) => [item.note]}
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
      <PageHeader title={t(lang, 'savedPassages')} onBack={goBack} lang={lang} />
      <StatusMessage empty={passages.length === 0} lang={lang} />
      {passages.length > 0 ? (
        <SavedList
          items={passages}
          lang={lang}
          lines={(item) => item.verses.map((verse) => `${verse.verseNumber} ${verse.text}`)}
          confirmKey="deletePassageConfirmTitle"
          onDelete={deleteSavedPassage}
        />
      ) : null}
    </section>
  )
}
