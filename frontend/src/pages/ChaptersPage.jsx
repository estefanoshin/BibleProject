import { useEffect, useState } from 'react'
import { fetchChapters } from '../api'
import { bookNameForId, localizedBookName } from '../bookCatalog'
import { canonicalBookIdFor } from '../chapterIdentity'
import { PageHeader, StatusMessage } from '../components/PageHeader.jsx'
import {
  chapterKey,
  rememberBookChapters,
  setChaptersRead,
  useReadProgress,
} from '../readProgress'
import { navigate } from '../router'
import { useUiLanguage } from '../uiLanguage'
import { chapterLabel, markSelectedLabel, readAriaLabel, t } from '../uiStrings'
import { useHorizontalSwipe } from '../useSwipe'
import { displayVersionName } from '../versionMeta'

function SelectIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <rect x="2.5" y="2.5" width="8" height="8" rx="1.6" strokeWidth="1.6" />
      <path
        d="M4.4 6.4 6 8l3.2-3.4"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="9.5" y="9.5" width="8" height="8" rx="1.6" strokeWidth="1.6" />
      <path
        d="M11.4 13.4 13 15l3.2-3.4"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function ChaptersPage({ bookId }) {
  const [chapters, setChapters] = useState([])
  const [canonicalId, setCanonicalId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [failure, setFailure] = useState(null)
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState(() => new Set())
  const { readKeys } = useReadProgress()
  const version = chapters[0]?.version
  const lang = useUiLanguage(version)

  useEffect(() => {
    setSelecting(false)
    setSelected(new Set())
  }, [bookId])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setFailure(null)
    setCanonicalId(null)
    fetchChapters(bookId)
      .then(async (data) => {
        if (cancelled) {
          return
        }
        setChapters(data)
        const canonical = await canonicalBookIdFor(data[0]?.version, bookId)
        if (!cancelled && canonical) {
          setCanonicalId(canonical)
          rememberBookChapters(canonical, data.map((chapter) => chapter.chapterNumber))
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
  }, [bookId])

  // Chapter payloads carry the source book name, so translate by name until the canonical id lands.
  const sourceName = localizedBookName({ name: chapters[0]?.bookName }, lang)
  const bookName = bookNameForId(canonicalId, lang, sourceName) || t(lang, 'chapters')
  const booksHref = version ? `#/versions/${encodeURIComponent(version)}/books` : '#/'
  const error = failure == null ? '' : failure || t(lang, 'chaptersError')

  useHorizontalSwipe({
    enabled: !selecting,
    onSwipeRight: () => navigate(booksHref),
  })

  function toggleSelecting() {
    setSelecting((on) => !on)
    setSelected(new Set())
  }

  function toggleChapter(key) {
    if (!key) {
      return
    }
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  function selectAll() {
    setSelected(
      new Set(chapters.map((chapter) => chapterKey(canonicalId, chapter.chapterNumber)).filter(Boolean)),
    )
  }

  const selectedAllRead =
    selected.size > 0 && [...selected].every((key) => readKeys.has(key))

  function applySelectedReadState() {
    if (selected.size === 0) {
      return
    }
    setChaptersRead([...selected], !selectedAllRead)
    setSelected(new Set())
    setSelecting(false)
  }

  return (
    <section className="page">
      <PageHeader
        title={bookName}
        subtitle={
          version ? `${displayVersionName(version)} · ${t(lang, 'chapters')}` : t(lang, 'chapters')
        }
        backTo={booksHref}
        backLabel={t(lang, 'books')}
        lang={lang}
        barActions={
          <button
            type="button"
            className="select-toggle"
            onClick={toggleSelecting}
            disabled={!canonicalId || chapters.length === 0}
            title={t(lang, 'selectChapters')}
            aria-label={t(lang, 'selectChapters')}
            aria-pressed={selecting}
          >
            <SelectIcon />
          </button>
        }
      />
      <StatusMessage
        loading={loading}
        error={error}
        empty={!loading && !error && chapters.length === 0}
        lang={lang}
      />
      <ul className="chapter-grid">
        {chapters.map((chapter) => {
          const key = chapterKey(canonicalId, chapter.chapterNumber)
          const read = readKeys.has(key)
          const isSelected = selected.has(key)
          const className = [
            'chapter-tile',
            read ? 'read' : '',
            isSelected ? 'selected' : '',
          ]
            .filter(Boolean)
            .join(' ')
          const label = readAriaLabel(lang, chapterLabel(lang, chapter.chapterNumber), read)
          const selectLabel = isSelected ? `${label}, ${t(lang, 'selectedSuffix')}` : label
          return (
            <li key={chapter.chapterId}>
              {selecting ? (
                <button
                  type="button"
                  className={className}
                  aria-pressed={isSelected}
                  aria-label={selectLabel}
                  onClick={() => toggleChapter(key)}
                >
                  {chapter.chapterNumber}
                </button>
              ) : (
                <a
                  className={className}
                  href={`#/chapters/${chapter.chapterId}`}
                  aria-label={label}
                >
                  {chapter.chapterNumber}
                </a>
              )}
            </li>
          )
        })}
      </ul>
      {selecting ? (
        <div className="chapter-select-bar">
          <button type="button" className="chapter-select-all" onClick={selectAll}>
            {t(lang, 'selectAll')}
          </button>
          <button
            type="button"
            className={selectedAllRead ? 'mark-read-button marked' : 'mark-read-button'}
            disabled={selected.size === 0}
            onClick={applySelectedReadState}
          >
            {markSelectedLabel(lang, selected.size, selectedAllRead)}
          </button>
        </div>
      ) : null}
    </section>
  )
}
