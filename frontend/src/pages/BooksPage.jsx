import { useEffect, useState } from 'react'
import { fetchBooks } from '../api'
import { bookAbbreviation } from '../bookAbbreviations'
import { PageHeader, StatusMessage } from '../components/PageHeader.jsx'
import { navigate } from '../router'
import { useHorizontalSwipe } from '../useSwipe'
import { GRID_VIEW, LIST_VIEW, readBooksView, writeBooksView } from '../viewPreference'

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

export default function BooksPage({ version }) {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState(readBooksView)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetchBooks(version)
      .then((data) => {
        if (!cancelled) {
          setBooks(data)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'No se pudieron cargar los libros.')
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

  const toggleButton = (
    <button
      type="button"
      className="view-toggle"
      onClick={toggleView}
      title={isGrid ? 'Ver lista con nombres completos' : 'Ver cuadrícula con abreviaturas'}
      aria-label={isGrid ? 'Ver lista con nombres completos' : 'Ver cuadrícula con abreviaturas'}
      aria-pressed={!isGrid}
    >
      {isGrid ? <ListIcon /> : <GridIcon />}
    </button>
  )

  return (
    <section className="page">
      <PageHeader
        title={version}
        subtitle="Libros"
        backTo="#/"
        backLabel="Versiones"
        actions={toggleButton}
      />
      <StatusMessage loading={loading} error={error} empty={!loading && !error && books.length === 0} />
      <ul className={isGrid ? 'book-grid' : 'card-list'}>
        {books.map((book) => (
          <li key={book.bookId}>
            {isGrid ? (
              <a
                className="book-tile"
                href={`#/books/${book.bookId}/chapters`}
                title={book.name}
                aria-label={book.name}
              >
                {bookAbbreviation(book.name)}
              </a>
            ) : (
              <a className="card" href={`#/books/${book.bookId}/chapters`}>
                <strong>{book.name}</strong>
                <span>{bookAbbreviation(book.name)}</span>
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
