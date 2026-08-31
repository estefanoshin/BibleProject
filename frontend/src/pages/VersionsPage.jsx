import { useEffect, useState } from 'react'
import { fetchVersions } from '../api'
import { PageHeader, StatusMessage } from '../components/PageHeader.jsx'

export default function VersionsPage() {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    fetchVersions()
      .then((data) => {
        if (!cancelled) {
          setVersions(data)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'No se pudieron cargar las versiones.')
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
  }, [])

  return (
    <section className="page">
      <PageHeader title="Biblia" subtitle="Elige una versión para empezar a leer" />
      <StatusMessage loading={loading} error={error} empty={!loading && !error && versions.length === 0} />
      <ul className="card-list">
        {versions.map((item) => (
          <li key={item.version}>
            <a className="card" href={`#/versions/${encodeURIComponent(item.version)}/books`}>
              <strong>{item.version}</strong>
              <span>
                {item.bookCount} {item.bookCount === 1 ? 'libro' : 'libros'}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
