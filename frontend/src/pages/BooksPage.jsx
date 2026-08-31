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
import { useReadProgress } from '../readProgress'
import { navigate } from '../router'
import { useHorizontalSwipe } from '../useSwipe'
import { useBookPageLanguage } from '../uiLanguage'
import { languageToggleAria, readAriaLabel, t } from '../uiStrings'
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

function BookList({ items, isGrid, lang, readBooks }) {
  return (
    <ul className={isGrid ? 'book-grid' : 'card-list'}>
      {items.map(({ book, index }) => {
        const name = localizedBookName(book, lang, index)
        const abbr = localizedBookAbbr(book, lang, index)
        const read = readBooks.has(canonicalBookId(book, index))
        const label = readAriaLabel(lang, name, read)
        return (
          <li key={book.bookId}>
            {isGrid ? (
              <a
                className={read ? 'book-tile read' : 'book-tile'}
                href={`#/books/${book.bookId}/chapters`}
                title={label}
                aria-label={label}
              >
                {abbr}
              </a>
            ) : (
              <a
                className={read ? 'card read' : 'card'}
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
  const { readBooks } = useReadProgress()
  const [lang, cycleLanguage] = useBookPageLanguage(version)

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

  useHorizontalSwipe({ onSwipeRight: () => navigate('/') })

  const isGrid = view === GRID_VIEW

  const toggleView = () => {
    const next = isGrid ? LIST_VIEW : GRID_VIEW
    setView(next)
    writeBooksView(next)
  }

  const viewLabel = isGrid ? t(lang, 'listView') : t(lang, 'gridView')

  const actions = (
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

  const { oldTestament, newTestament } = splitByTestament(books)
  const matchBook = ({ book, index }) => bookMatchesQuery(book, index, query)
  const visibleOld = oldTestament.filter(matchBook)
  const visibleNew = newTestament.filter(matchBook)
  const error = failure == null ? '' : failure || t(lang, 'booksError')
  const noMatches =
    !loading && !error && books.length > 0 && visibleOld.length === 0 && visibleNew.length === 0

  return (
    <section className="page books-page">
      <PageHeader
        title={displayVersionName(version)}
        subtitle={t(lang, 'books')}
        backTo="#/"
        backLabel={t(lang, 'versions')}
        actions={actions}
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
          <BookList items={visibleOld} isGrid={isGrid} lang={lang} readBooks={readBooks} />
        </div>
      ) : null}
      {visibleNew.length > 0 ? (
        <div className="book-section">
          <h2 className="section-heading">
            <span>{testamentLabel(lang, 'nt')}</span>
          </h2>
          <BookList items={visibleNew} isGrid={isGrid} lang={lang} readBooks={readBooks} />
        </div>
      ) : null}
      {noMatches ? <p className="status">{t(lang, 'noMatchingBooks')}</p> : null}
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
    </section>
  )
}
