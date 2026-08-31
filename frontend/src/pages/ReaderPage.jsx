import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { fetchChapterVerses, fetchVersions } from '../api'
import { bookNameForId, localizedBookName } from '../bookCatalog'
import { canonicalBookIdFor, chapterIdInVersion } from '../chapterIdentity'
import { resolveChapterNeighbors } from '../chapterNavigation'
import { copyText, hasTextSelection } from '../clipboard'
import { PageHeader, StatusMessage } from '../components/PageHeader.jsx'
import { chapterKey, isChapterRead, setChapterRead } from '../readProgress'
import {
  deletePassageNote,
  savePassage,
  saveVerseNote,
  updatePassageNote,
  usePassageStorage,
  verseNoteKey,
} from '../passageStorage'
import {
  currentVerseAnchor,
  rememberVerseAnchor,
  scrollToVerse,
  takeVerseAnchor,
} from '../readerScroll'
import { navigate } from '../router'
import { useUiLanguage } from '../uiLanguage'
import { chapterLabel, chapterTitle, readButtonLabel, t } from '../uiStrings'
import { useHorizontalSwipe } from '../useSwipe'
import { displayVersionName, groupVersions } from '../versionMeta'

const NO_NEIGHBORS = { previous: null, next: null }

function foldText(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function matchRanges(text, query) {
  const needle = foldText(query).replace(/\s+/g, ' ').trim()
  if (!needle) {
    return []
  }
  const map = []
  let folded = ''
  for (let i = 0; i < text.length; i += 1) {
    const piece = foldText(text[i])
    for (let j = 0; j < piece.length; j += 1) {
      map.push(i)
      folded += piece[j]
    }
  }
  const ranges = []
  let from = 0
  while (from <= folded.length - needle.length) {
    const at = folded.indexOf(needle, from)
    if (at === -1) {
      break
    }
    ranges.push([map[at], map[at + needle.length - 1] + 1])
    from = at + needle.length
  }
  return ranges
}

function HighlightedText({ text, ranges, currentRange }) {
  if (!ranges.length) {
    return text
  }
  const parts = []
  let cursor = 0
  ranges.forEach(([start, end], index) => {
    if (start > cursor) {
      parts.push(text.slice(cursor, start))
    }
    parts.push(
      <mark key={`${start}-${end}`} className={index === currentRange ? 'verse-hit current' : 'verse-hit'}>
        {text.slice(start, end)}
      </mark>,
    )
    cursor = end
  })
  if (cursor < text.length) {
    parts.push(text.slice(cursor))
  }
  return parts
}

export default function ReaderPage({ chapterId }) {
  const [chapter, setChapter] = useState(null)
  const [neighbors, setNeighbors] = useState(NO_NEIGHBORS)
  const [loading, setLoading] = useState(true)
  const [failure, setFailure] = useState(null)
  const [canonicalId, setCanonicalId] = useState(null)
  const [read, setRead] = useState(false)
  const [versions, setVersions] = useState([])
  const [selectedVerseIds, setSelectedVerseIds] = useState(() => new Set())
  const [noteOpen, setNoteOpen] = useState(false)
  const [note, setNote] = useState('')
  const [viewingKey, setViewingKey] = useState(null)
  const [actionMessage, setActionMessage] = useState('')
  const [query, setQuery] = useState('')
  const [matchIndex, setMatchIndex] = useState(0)
  const anchorRef = useRef(null)
  const lang = useUiLanguage(chapter?.version)
  const { passageNotes, savedPassages } = usePassageStorage()
  const notedVerseKeys = new Set(
    passageNotes.flatMap((item) => {
      const verse = item.verses?.[0]
      return verse ? [verseNoteKey(item.canonicalBookId, item.chapterNumber, verse.verseNumber)] : []
    }),
  )
  const savedVerseKeys = new Set(
    savedPassages.flatMap((item) =>
      (item.verses ?? []).map((verse) =>
        verseNoteKey(item.canonicalBookId, item.chapterNumber, verse.verseNumber),
      ),
    ),
  )
  const viewingNotes = viewingKey
    ? passageNotes.filter((item) => {
        const noted = item.verses?.[0]
        return (
          noted &&
          verseNoteKey(item.canonicalBookId, item.chapterNumber, noted.verseNumber) === viewingKey
        )
      })
    : []
  const selectedVerses =
    chapter?.verses?.filter((verse) => selectedVerseIds.has(String(verse.verseId))) ?? []

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setFailure(null)
    setNeighbors(NO_NEIGHBORS)
    setCanonicalId(null)
    setRead(false)
    setSelectedVerseIds(new Set())
    setNoteOpen(false)
    setViewingKey(null)
    setActionMessage('')
    // Strict mode runs this effect twice, so only overwrite the anchor when a
    // fresh one is pending; the second run would otherwise clear it.
    const pendingAnchor = takeVerseAnchor()
    if (pendingAnchor != null) {
      anchorRef.current = pendingAnchor
    }
    fetchChapterVerses(chapterId)
      .then(async (data) => {
        if (cancelled) {
          return
        }
        setChapter(data)
        const canonical = await canonicalBookIdFor(data.version, data.bookId)
        if (!cancelled) {
          setCanonicalId(canonical)
          setRead(isChapterRead(chapterKey(canonical, data.chapterNumber)))
        }
        const resolved = await resolveChapterNeighbors(data)
        if (!cancelled) {
          setNeighbors(resolved)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setFailure(err.message ?? '')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [chapterId])

  useLayoutEffect(() => {
    if (!chapter) {
      return
    }
    const anchor = anchorRef.current
    anchorRef.current = null
    if (anchor == null || !scrollToVerse(anchor)) {
      window.scrollTo(0, 0)
    }
  }, [chapter])

  useLayoutEffect(() => {
    if (!query.trim()) {
      return
    }
    document.querySelector('.verse-hit.current')?.scrollIntoView({
      block: 'center',
      inline: 'nearest',
    })
  }, [query, matchIndex, chapter])

  useEffect(() => {
    let cancelled = false
    fetchVersions()
      .then((data) => {
        if (!cancelled) {
          setVersions(data)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  useHorizontalSwipe({
    onSwipeLeft: () => goTo(neighbors.next),
    onSwipeRight: () => goTo(neighbors.previous),
    enabled: selectedVerseIds.size === 0,
  })

  useEffect(() => {
    if (!actionMessage) {
      return undefined
    }
    const timeout = window.setTimeout(() => setActionMessage(''), 2200)
    return () => window.clearTimeout(timeout)
  }, [actionMessage])

  function goTo(target) {
    if (target) {
      navigate(`/chapters/${target.chapterId}`)
    }
  }

  function toggleRead() {
    const key = chapterKey(canonicalId, chapter?.chapterNumber)
    if (key) {
      setRead(setChapterRead(key, !read))
    }
  }

  function toggleVerse(verseId) {
    const id = String(verseId)
    setSelectedVerseIds((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
    setActionMessage('')
  }

  function clearSelection() {
    setSelectedVerseIds(new Set())
    setNoteOpen(false)
    setNote('')
    setActionMessage('')
  }

  function selectedPassage() {
    return {
      canonicalBookId: canonicalId,
      bookId: chapter.bookId,
      bookName,
      chapterId,
      chapterNumber: chapter.chapterNumber,
      version: chapter.version,
      reference: passageReference(bookName, chapter.chapterNumber, selectedVerses),
      verses: selectedVerses.map(({ verseId, verseNumber, text }) => ({
        verseId,
        verseNumber,
        text,
      })),
    }
  }

  function passageText() {
    const passage = selectedPassage()
    const body = passage.verses
      .map((verse) => `${verse.verseNumber} ${verse.text}`)
      .join('\n')
    return `${passage.reference} (${displayVersionName(passage.version)})\n${body}`
  }

  async function copySelection(messageKey = 'passageCopied') {
    const copied = await copyText(passageText())
    setActionMessage(t(lang, copied ? messageKey : 'copyError'))
  }

  async function saveSelection() {
    const saved = await savePassage(selectedPassage())
    if (saved) {
      clearSelection()
      return
    }
    setActionMessage(t(lang, 'passageSaveError'))
  }

  function openVerseNotes(event, verse) {
    event.stopPropagation()
    event.preventDefault()
    const key = verseNoteKey(canonicalId, chapter.chapterNumber, verse.verseNumber)
    const hasNotes = passageNotes.some((item) => {
      const noted = item.verses?.[0]
      return noted && verseNoteKey(item.canonicalBookId, item.chapterNumber, noted.verseNumber) === key
    })
    if (!hasNotes) {
      return
    }
    setNoteOpen(false)
    setViewingKey(key)
  }

  async function saveNote() {
    if (!note.trim() || selectedVerses.length !== 1) {
      return
    }
    const saved = await saveVerseNote(selectedPassage(), note)
    if (saved) {
      clearSelection()
      return
    }
    setActionMessage(t(lang, 'passageSaveError'))
  }

  async function saveViewedNote(item, text) {
    const saved = await updatePassageNote(item.id, text)
    setActionMessage(t(lang, saved ? 'noteSaved' : 'passageSaveError'))
    return saved
  }

  async function deleteViewedNote(item) {
    const lastNote = viewingNotes.length <= 1
    const deleted = await deletePassageNote(item.id)
    if (deleted && lastNote) {
      setViewingKey(null)
    }
    setActionMessage(t(lang, deleted ? 'noteDeleted' : 'passageSaveError'))
    return deleted
  }

  async function shareSelection() {
    const text = passageText()
    if (navigator.share) {
      try {
        await navigator.share({ title: selectedPassage().reference, text })
        return
      } catch (error) {
        if (error?.name === 'AbortError') {
          return
        }
      }
    }
    await copySelection('shareFallback')
  }

  async function openInVersion(version) {
    if (!chapter || version === chapter.version) {
      return
    }
    const anchor = currentVerseAnchor()
    const targetId = await chapterIdInVersion(version, canonicalId, chapter.chapterNumber)
    if (!targetId) {
      navigate(`/versions/${encodeURIComponent(version)}/books`)
      return
    }
    rememberVerseAnchor(anchor)
    navigate(`/chapters/${targetId}`)
  }

  const chaptersHref = chapter ? `#/books/${chapter.bookId}/chapters` : '#/'
  const error = failure == null ? '' : failure || t(lang, 'chapterError')
  const bookName = bookNameForId(canonicalId, lang, localizedBookName({ name: chapter?.bookName }, lang))
  const verseHits = new Map()
  const matchList = []
  if (chapter && query.trim()) {
    for (const verse of chapter.verses) {
      const ranges = matchRanges(verse.text, query)
      if (ranges.length) {
        verseHits.set(String(verse.verseId), ranges)
        ranges.forEach((_, rangeIndex) => {
          matchList.push({ verseId: String(verse.verseId), rangeIndex })
        })
      }
    }
  }
  const activeMatch = matchList.length
    ? matchList[Math.min(matchIndex, matchList.length - 1)]
    : null
  const shownIndex = matchList.length ? Math.min(matchIndex, matchList.length - 1) : 0

  function setFinderQuery(value) {
    setQuery(value)
    setMatchIndex(0)
  }

  function stepMatch(direction) {
    if (matchList.length === 0) {
      return
    }
    setMatchIndex((current) => (current + direction + matchList.length) % matchList.length)
  }

  return (
    <section className={selectedVerses.length > 0 ? 'page reader selecting-verses' : 'page reader'}>
      <PageHeader
        title={chapter ? chapterTitle(lang, bookName, chapter.chapterNumber) : t(lang, 'reading')}
        subtitle={chapter ? displayVersionName(chapter.version) : null}
        backTo={chaptersHref}
        backLabel={t(lang, 'chapters')}
        lang={lang}
      />
      <StatusMessage
        loading={loading}
        error={error}
        empty={!loading && !error && chapter?.verses?.length === 0}
        lang={lang}
      />
      {chapter ? (
        <>
          <article className="verses">
            {chapter.verses.map((verse) => {
              const selected = selectedVerseIds.has(String(verse.verseId))
              const noteKey = verseNoteKey(canonicalId, chapter.chapterNumber, verse.verseNumber)
              const hasNote = notedVerseKeys.has(noteKey)
              const saved = savedVerseKeys.has(noteKey)
              const ranges = verseHits.get(String(verse.verseId)) ?? []
              const currentRange =
                activeMatch?.verseId === String(verse.verseId) ? activeMatch.rangeIndex : -1
              return (
              <p
                key={verse.verseId}
                data-verse={verse.verseNumber}
                className={['verse', saved ? 'saved' : '', selected ? 'selected' : '']
                  .filter(Boolean)
                  .join(' ')}
                role="button"
                tabIndex="0"
                aria-pressed={selected}
                onClick={(event) => {
                  if (event.target.closest('.verse-note-mark')) {
                    return
                  }
                  toggleVerse(verse.verseId)
                }}
                onKeyDown={(event) => {
                  if (event.target.closest('.verse-note-mark')) {
                    return
                  }
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    toggleVerse(verse.verseId)
                  }
                }}
              >
                <sup>{verse.verseNumber}</sup>
                <HighlightedText text={verse.text} ranges={ranges} currentRange={currentRange} />
                {hasNote ? (
                  <button
                    type="button"
                    className="verse-note-mark"
                    title={t(lang, 'verseHasNote')}
                    aria-label={t(lang, 'verseHasNote')}
                    onClick={(event) => openVerseNotes(event, verse)}
                  >
                    <ActionIcon name="note" />
                  </button>
                ) : null}
              </p>
              )
            })}
          </article>
          <button
            type="button"
            className={read ? 'mark-read-button marked' : 'mark-read-button'}
            aria-pressed={read}
            disabled={!canonicalId}
            onClick={toggleRead}
          >
            {readButtonLabel(lang, read)}
          </button>
          <nav className="chapter-nav">
            <NeighborLink target={neighbors.previous} direction={-1} lang={lang} />
            <NeighborLink target={neighbors.next} direction={1} lang={lang} />
          </nav>
        </>
      ) : null}
      {selectedVerses.length > 0 ? (
        <PassageActionBar
          count={selectedVerses.length}
          message={actionMessage}
          lang={lang}
          canNote={selectedVerses.length === 1}
          onCopy={copySelection}
          onNote={() => {
            if (selectedVerses.length === 1) {
              setViewingKey(null)
              setNoteOpen(true)
            } else {
              setActionMessage(t(lang, 'noteSingleVerse'))
            }
          }}
          onSave={saveSelection}
          onShare={shareSelection}
          onClose={clearSelection}
        />
      ) : (
        <div className="reader-dock" data-swipe-ignore="true">
          <VerseFinder
            query={query}
            matchIndex={shownIndex}
            matchCount={matchList.length}
            lang={lang}
            onQueryChange={setFinderQuery}
            onPrev={() => stepMatch(-1)}
            onNext={() => stepMatch(1)}
          />
          <VersionBar
            versions={versions}
            current={chapter?.version}
            onSelect={openInVersion}
            lang={lang}
          />
        </div>
      )}
      {noteOpen ? (
        <NoteDialog
          title={t(lang, 'addNote')}
          reference={selectedPassage().reference}
          note={note}
          lang={lang}
          onChange={setNote}
          onCancel={() => setNoteOpen(false)}
          onSave={saveNote}
        />
      ) : null}
      {viewingNotes.length ? (
        <ViewNoteDialog
          notes={viewingNotes}
          lang={lang}
          onClose={() => setViewingKey(null)}
          onSave={saveViewedNote}
          onDelete={deleteViewedNote}
        />
      ) : null}
    </section>
  )
}

const DISMISS_DISTANCE = 56

function PassageActionBar({
  count,
  message,
  lang,
  canNote,
  onCopy,
  onNote,
  onSave,
  onShare,
  onClose,
}) {
  const drag = useRef(null)
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const actions = [
    ['copy', 'copyPassage', onCopy, true],
    ['note', 'notePassage', onNote, canNote],
    ['save', 'savePassage', onSave, true],
    ['share', 'sharePassage', onShare, true],
  ]

  function pointerFrom(event) {
    if (event.touches?.length) {
      return event.touches[0]
    }
    if (event.changedTouches?.length) {
      return event.changedTouches[0]
    }
    return event
  }

  function beginDrag(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return
    }
    if (event.target.closest?.('button')) {
      return
    }
    const point = pointerFrom(event)
    drag.current = { y: point.clientY }
    setDragging(true)
    if (event.pointerId != null) {
      event.currentTarget.setPointerCapture?.(event.pointerId)
    }
  }

  function moveDrag(event) {
    if (!drag.current) {
      return
    }
    const point = pointerFrom(event)
    const dy = Math.max(0, point.clientY - drag.current.y)
    setOffset(dy)
    if (event.cancelable && dy > 8) {
      event.preventDefault()
    }
  }

  function endDrag(event) {
    if (!drag.current) {
      return
    }
    const point = pointerFrom(event)
    const dy = Math.max(0, point.clientY - drag.current.y)
    drag.current = null
    setDragging(false)
    if (dy >= DISMISS_DISTANCE) {
      onClose()
      return
    }
    setOffset(0)
  }

  return (
    <aside
      className={dragging ? 'passage-action-bar dragging' : 'passage-action-bar'}
      data-swipe-ignore="true"
      style={{
        transform: offset ? `translateY(${offset}px)` : undefined,
        opacity: offset ? Math.max(0.35, 1 - offset / 180) : undefined,
      }}
      onPointerDown={beginDrag}
      onPointerMove={moveDrag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onTouchStart={beginDrag}
      onTouchMove={moveDrag}
      onTouchEnd={endDrag}
      onTouchCancel={endDrag}
      aria-label={t(lang, 'passageActions')}
    >
      <span className="passage-action-handle" aria-hidden="true" />
      <button
        type="button"
        className="passage-action-close"
        onClick={onClose}
        title={t(lang, 'close')}
        aria-label={t(lang, 'close')}
      >
        ×
      </button>
      <span className="passage-selection-count">{count} {t(lang, 'versesSelected')}</span>
      {message ? <span className="passage-action-message" role="status">{message}</span> : null}
      <div className="passage-actions">
        {actions.map(([icon, label, action, enabled]) => (
          <button key={icon} type="button" disabled={!enabled} onClick={() => action()}>
            <ActionIcon name={icon} />
            <span>{t(lang, label)}</span>
          </button>
        ))}
      </div>
    </aside>
  )
}

function formatSavedAt(value, lang) {
  try {
    return new Date(value).toLocaleString(lang)
  } catch {
    return value
  }
}

function EditIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path
        d="M4 14.7V16.5h1.8L14.2 8.1 12.4 6.3 4 14.7zM13.1 5.6l1.8 1.8 1.1-1.1a1 1 0 0 0 0-1.4l-.4-.4a1 1 0 0 0-1.4 0z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
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

function NoteIconButtons({ lang, onEdit, onDelete }) {
  return (
    <div className="note-dialog-icon-actions">
      <button
        type="button"
        className="note-dialog-icon-btn"
        title={t(lang, 'edit')}
        aria-label={t(lang, 'edit')}
        onClick={onEdit}
      >
        <EditIcon />
      </button>
      <button
        type="button"
        className="note-dialog-icon-btn danger"
        title={t(lang, 'delete')}
        aria-label={t(lang, 'delete')}
        onClick={onDelete}
      >
        <TrashIcon />
      </button>
    </div>
  )
}

function ViewNoteDialog({ notes, lang, onClose, onSave, onDelete }) {
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [copyMessage, setCopyMessage] = useState('')
  const first = notes[0]

  useEffect(() => {
    if (!copyMessage) {
      return undefined
    }
    const timeout = window.setTimeout(() => setCopyMessage(''), 2200)
    return () => window.clearTimeout(timeout)
  }, [copyMessage])

  function beginEdit(item) {
    setPendingDelete(null)
    setEditing(item)
    setDraft(item.note)
  }

  async function copyNote(item) {
    if (hasTextSelection()) {
      return
    }
    const text = `${item.reference} (${displayVersionName(item.version)})\n${item.note}`
    const copied = await copyText(text)
    setCopyMessage(t(lang, copied ? 'noteCopied' : 'copyError'))
  }

  if (editing) {
    return (
      <NoteDialog
        title={t(lang, 'editNote')}
        reference={editing.reference}
        note={draft}
        lang={lang}
        onChange={setDraft}
        onCancel={() => setEditing(null)}
        onSave={async () => {
          if (await onSave(editing, draft)) {
            setEditing(null)
          }
        }}
      />
    )
  }

  if (pendingDelete) {
    return (
      <div className="note-dialog-backdrop" role="presentation" onMouseDown={() => setPendingDelete(null)}>
        <section
          className="note-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-note-dialog-title"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="note-dialog-header">
            <h2 id="delete-note-dialog-title">{t(lang, 'deleteNoteConfirmTitle')}</h2>
            <button
              type="button"
              className="note-dialog-close"
              onClick={() => setPendingDelete(null)}
              title={t(lang, 'close')}
              aria-label={t(lang, 'close')}
            >
              ×
            </button>
          </div>
          <p>{pendingDelete.reference}</p>
          <p>{t(lang, 'deleteConfirm')}</p>
          <div className="note-dialog-actions">
            <button type="button" onClick={() => setPendingDelete(null)}>{t(lang, 'cancel')}</button>
            <button
              type="button"
              className="danger"
              onClick={async () => {
                await onDelete(pendingDelete)
                setPendingDelete(null)
              }}
            >
              {t(lang, 'delete')}
            </button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="note-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="note-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-note-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="note-dialog-header">
          <h2 id="view-note-dialog-title">{t(lang, 'viewNote')}</h2>
          <button
            type="button"
            className="note-dialog-close"
            onClick={onClose}
            title={t(lang, 'close')}
            aria-label={t(lang, 'close')}
          >
            ×
          </button>
        </div>
        <p>{first.reference}</p>
        <div className="note-dialog-read">
          {notes.map((item) => (
            <div key={item.id} className="note-dialog-entry">
              <div className="note-dialog-entry-toolbar">
                <span className="note-dialog-entry-meta">
                  {displayVersionName(item.version)}
                  {item.savedAt ? ` · ${formatSavedAt(item.savedAt, lang)}` : ''}
                </span>
                <NoteIconButtons
                  lang={lang}
                  onEdit={() => beginEdit(item)}
                  onDelete={() => setPendingDelete(item)}
                />
              </div>
              <button
                type="button"
                className="note-dialog-entry-text"
                title={t(lang, 'copyPassage')}
                onClick={() => copyNote(item)}
              >
                {item.note}
              </button>
            </div>
          ))}
        </div>
        {copyMessage ? (
          <p className="note-dialog-status" role="status">
            {copyMessage}
          </p>
        ) : null}
        <div className="note-dialog-actions">
          <button type="button" className="primary" onClick={onClose}>
            {t(lang, 'close')}
          </button>
        </div>
      </section>
    </div>
  )
}

function NoteDialog({ title, reference, note, lang, onChange, onCancel, onSave }) {
  return (
    <div className="note-dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        className="note-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="note-dialog-header">
          <h2 id="note-dialog-title">{title}</h2>
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
        <textarea
          autoFocus
          value={note}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t(lang, 'notePlaceholder')}
          rows="5"
        />
        <div className="note-dialog-actions">
          <button type="button" onClick={onCancel}>{t(lang, 'cancel')}</button>
          <button type="button" className="primary" disabled={!note.trim()} onClick={onSave}>
            {t(lang, 'saveNote')}
          </button>
        </div>
      </section>
    </div>
  )
}

function ActionIcon({ name }) {
  if (name === 'copy') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8h11v11H8zM5 16H3V3h13v2" /></svg>
  }
  if (name === 'note') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v13H8l-4 3zM8 8h8M8 12h6" /></svg>
  }
  if (name === 'save') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z" /></svg>
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V3M7 8l5-5 5 5M5 13v7h14v-7" /></svg>
}

function passageReference(bookName, chapterNumber, verses) {
  const numbers = verses.map((verse) => Number(verse.verseNumber)).filter(Number.isFinite)
  const groups = []
  for (const number of numbers) {
    const last = groups.at(-1)
    if (last && number === last[1] + 1) {
      last[1] = number
    } else {
      groups.push([number, number])
    }
  }
  const verseLabel = groups
    .map(([start, end]) => (start === end ? String(start) : `${start}-${end}`))
    .join(',')
  return `${bookName} ${chapterNumber}:${verseLabel}`
}

function VerseFinder({ query, matchIndex, matchCount, lang, onQueryChange, onPrev, onNext }) {
  return (
    <div className="verse-finder">
      <label className="verse-finder-field">
        <span className="visually-hidden">{t(lang, 'findText')}</span>
        <svg className="verse-finder-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12.5 12.5 17 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              if (event.shiftKey) {
                onPrev()
              } else {
                onNext()
              }
            }
          }}
          placeholder={t(lang, 'findTextPlaceholder')}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
          enterKeyHint="search"
        />
      </label>
      {query ? (
        <>
          <span className="verse-finder-count">
            {matchCount ? `${matchIndex + 1}/${matchCount}` : '0/0'}
          </span>
          <button
            type="button"
            className="verse-finder-nav"
            onClick={onPrev}
            disabled={!matchCount}
            title={t(lang, 'findPrevious')}
            aria-label={t(lang, 'findPrevious')}
          >
            ‹
          </button>
          <button
            type="button"
            className="verse-finder-nav"
            onClick={onNext}
            disabled={!matchCount}
            title={t(lang, 'findNext')}
            aria-label={t(lang, 'findNext')}
          >
            ›
          </button>
          <button
            type="button"
            className="verse-finder-clear"
            onClick={() => onQueryChange('')}
            aria-label={t(lang, 'clearSearch')}
          >
            ×
          </button>
        </>
      ) : null}
    </div>
  )
}

function VersionBar({ versions, current, onSelect, lang }) {
  const barRef = useRef(null)
  const activeRef = useRef(null)

  useEffect(() => {
    const bar = barRef.current
    const active = activeRef.current
    if (!bar || !active) {
      return
    }
    const centered = active.offsetLeft - (bar.clientWidth - active.offsetWidth) / 2
    bar.scrollLeft = Math.max(0, Math.min(centered, bar.scrollWidth - bar.clientWidth))
  }, [current, versions])

  if (versions.length === 0) {
    return null
  }

  const ordered = groupVersions(versions, t(lang, 'otherLanguages')).flatMap((group) => group.items)

  return (
    <nav
      className="version-bar"
      ref={barRef}
      data-swipe-ignore="true"
      aria-label={t(lang, 'otherVersions')}
    >
      <ul className="version-tabs">
        {ordered.map((item) => {
          const active = item.version === current
          return (
            <li key={item.version}>
              <button
                type="button"
                ref={active ? activeRef : null}
                className={active ? 'version-tab active' : 'version-tab'}
                aria-current={active ? 'true' : undefined}
                onClick={() => onSelect(item.version)}
              >
                {displayVersionName(item.version)}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function NeighborLink({ target, direction, lang }) {
  if (!target) {
    return <span />
  }
  const label = target.otherBook
    ? chapterTitle(lang, localizedBookName({ name: target.bookName }, lang), target.chapterNumber)
    : chapterLabel(lang, target.chapterNumber)
  return (
    <a href={`#/chapters/${target.chapterId}`}>
      {direction < 0 ? `‹ ${label}` : `${label} ›`}
    </a>
  )
}
