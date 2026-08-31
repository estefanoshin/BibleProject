import { useEffect, useState } from 'react'
import { fetchBooks } from '../api'
import { PageHeader, StatusMessage } from '../components/PageHeader.jsx'

export default function BooksPage({ version }) {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  return (
    <section className="page">
      <PageHeader title={version} subtitle="Libros" backTo="#/" backLabel="Versiones" />
      <StatusMessage loading={loading} error={error} empty={!loading && !error && books.length === 0} />
      <ul className="card-list">
        {books.map((book) => (
          <li key={book.bookId}>
            <a className="card" href={`#/books/${book.bookId}/chapters`}>
              <strong>{book.name}</strong>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
