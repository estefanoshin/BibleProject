import { useEffect, useState } from 'react'
import { fetchBooks } from '../api'
import {
  bookMatchesQuery,
  canonicalBookId,
  localizedBookAbbr,
  localizedBookName,
  splitByTestament,
  testamentLabel,
} from '../bookCatalog'
import { PageHeader, StatusMessage } from '../components/PageHeader.jsx'
import { setBooksRead, useReadProgress } from '../readProgress'
import { navigate } from '../router'
import { useHorizontalSwipe } from '../useSwipe'
import { useBookPageLanguage } from '../uiLanguage'
import { languageToggleAria, markSelectedLabel, readAriaLabel, t } from '../uiStrings'
import { GRID_VIEW, LIST_VIEW, readBooksView, writeBooksView } from '../viewPreference'
import { displayVersionName, languageLabel } from '../versionMeta'

function GridIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <rect x="2" y="2" width="7" height="7" rx="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <rect x="2" y="3" width="16" height="3" rx="1.5" />
      <rect x="2" y="8.5" width="16" height="3" rx="1.5" />
      <rect x="2" y="14" width="16" height="3" rx="1.5" />
    </svg>
  )
}

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

function BookList({ items, isGrid, lang, readBooks, selecting, selected, onToggle }) {
  return (
    <ul className={isGrid ? 'book-grid' : 'card-list'}>
      {items.map(({ book, index }) => {
        const name = localizedBookName(book, lang, index)
        const abbr = localizedBookAbbr(book, lang, index)
        const id = canonicalBookId(book, index)
        const read = readBooks.has(id)
        const isSelected = selected.has(id)
        const label = readAriaLabel(lang, name, read)
        const selectLabel = isSelected ? `${label}, ${t(lang, 'selectedSuffix')}` : label
        const className = [
          isGrid ? 'book-tile' : 'card',
          read ? 'read' : '',
          isSelected ? 'selected' : '',
        ]
          .filter(Boolean)
          .join(' ')
        return (
          <li key={book.bookId}>
            {selecting ? (
              <button
                type="button"
                className={className}
                aria-pressed={isSelected}
                aria-label={selectLabel}
                disabled={!id}
                onClick={() => onToggle(id)}
              >
                {isGrid ? abbr : (
                  <>
                    <strong>{name}</strong>
                    <span>{abbr}</span>
                  </>
                )}
              </button>
            ) : isGrid ? (
              <a
                className={className}
                href={`#/books/${book.bookId}/chapters`}
                title={label}
                aria-label={label}
              >
                {abbr}
              </a>
            ) : (
              <a
                className={className}
                href={`#/books/${book.bookId}/chapters`}
                aria-label={label}
              >
                <strong>{name}</strong>
                <span>{abbr}</span>
              </a>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default function BooksPage({ version }) {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [failure, setFailure] = useState(null)
  const [view, setView] = useState(readBooksView)
  const [query, setQuery] = useState('')
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState(() => new Set())
  const { readBooks } = useReadProgress()
  const [lang, cycleLanguage] = useBookPageLanguage(version)

  useEffect(() => {
    setSelecting(false)
    setSelected(new Set())
  }, [version])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setFailure(null)
    fetchBooks(version)
      .then((data) => {
        if (!cancelled) {
          setBooks(data)
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
  }, [version])

  useHorizontalSwipe({
    enabled: !selecting,
    onSwipeRight: () => navigate('/'),
  })

  const isGrid = view === GRID_VIEW

  const toggleView = () => {
    const next = isGrid ? LIST_VIEW : GRID_VIEW
    setView(next)
    writeBooksView(next)
  }

  function toggleSelecting() {
    setSelecting((on) => !on)
    setSelected(new Set())
  }

  function toggleBook(id) {
    if (!id) {
      return
    }
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const viewLabel = isGrid ? t(lang, 'listView') : t(lang, 'gridView')

  const { oldTestament, newTestament } = splitByTestament(books)
  const matchBook = ({ book, index }) => bookMatchesQuery(book, index, query)
  const visibleOld = oldTestament.filter(matchBook)
  const visibleNew = newTestament.filter(matchBook)
  const visibleItems = [...visibleOld, ...visibleNew]
  const error = failure == null ? '' : failure || t(lang, 'booksError')
  const noMatches =
    !loading && !error && books.length > 0 && visibleOld.length === 0 && visibleNew.length === 0

  const selectedAllRead =
    selected.size > 0 && [...selected].every((id) => readBooks.has(id))

  function selectAll() {
    setSelected(
      new Set(visibleItems.map(({ book, index }) => canonicalBookId(book, index)).filter(Boolean)),
    )
  }

  function applySelectedReadState() {
    if (selected.size === 0) {
      return
    }
    setBooksRead([...selected], !selectedAllRead)
    setSelected(new Set())
    setSelecting(false)
  }

  const listProps = {
    isGrid,
    lang,
    readBooks,
    selecting,
    selected,
    onToggle: toggleBook,
  }

  const titleActions = (
    <>
      <button
        type="button"
        className="lang-toggle"
        onClick={cycleLanguage}
        title={t(lang, 'changeLanguage')}
        aria-label={languageToggleAria(lang)}
      >
        {languageLabel(lang)}
      </button>
      <button
        type="button"
        className="view-toggle"
        onClick={toggleView}
        title={viewLabel}
        aria-label={viewLabel}
        aria-pressed={!isGrid}
      >
        {isGrid ? <ListIcon /> : <GridIcon />}
      </button>
    </>
  )

  const barActions = (
    <button
      type="button"
      className="select-toggle"
      onClick={toggleSelecting}
      disabled={books.length === 0}
      title={t(lang, 'selectBooks')}
      aria-label={t(lang, 'selectBooks')}
      aria-pressed={selecting}
    >
      <SelectIcon />
    </button>
  )

  return (
    <section className="page books-page">
      <PageHeader
        title={displayVersionName(version)}
        subtitle={t(lang, 'books')}
        backTo="#/"
        backLabel={t(lang, 'versions')}
        barActions={barActions}
        titleActions={titleActions}
        lang={lang}
      />
      <StatusMessage
        loading={loading}
        error={error}
        empty={!loading && !error && books.length === 0}
        lang={lang}
      />
      {visibleOld.length > 0 ? (
        <div className="book-section">
          <h2 className="section-heading">
            <span>{testamentLabel(lang, 'ot')}</span>
          </h2>
          <BookList items={visibleOld} {...listProps} />
        </div>
      ) : null}
      {visibleNew.length > 0 ? (
        <div className="book-section">
          <h2 className="section-heading">
            <span>{testamentLabel(lang, 'nt')}</span>
          </h2>
          <BookList items={visibleNew} {...listProps} />
        </div>
      ) : null}
      {noMatches ? <p className="status">{t(lang, 'noMatchingBooks')}</p> : null}
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
            {markSelectedLabel(lang, selected.size, selectedAllRead, 'book')}
          </button>
        </div>
      ) : (
        <div className="book-finder">
          <label className="book-finder-field">
            <span className="visually-hidden">{t(lang, 'findBook')}</span>
            <svg className="book-finder-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
              <circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12.5 12.5 17 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t(lang, 'findBookPlaceholder')}
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              enterKeyHint="search"
            />
          </label>
          {query ? (
            <button
              type="button"
              className="book-finder-clear"
              onClick={() => setQuery('')}
              aria-label={t(lang, 'clearSearch')}
            >
              ×
            </button>
          ) : null}
        </div>
      )}
    </section>
  )
}
