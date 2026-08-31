import { useEffect, useState } from 'react'
import { fetchChapters } from '../api'
import { canonicalBookIdFor } from '../chapterIdentity'
import { PageHeader, StatusMessage } from '../components/PageHeader.jsx'
import { chapterKey, readChapterKeys, rememberBookChapters } from '../readProgress'
import { navigate } from '../router'
import { useHorizontalSwipe } from '../useSwipe'

export default function ChaptersPage({ bookId }) {
  const [chapters, setChapters] = useState([])
  const [canonicalId, setCanonicalId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
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
          setError(err.message || 'No se pudieron cargar los capítulos.')
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

  const bookName = chapters[0]?.bookName || 'Capítulos'
  const version = chapters[0]?.version
  const booksHref = version ? `#/versions/${encodeURIComponent(version)}/books` : '#/'

  useHorizontalSwipe({ onSwipeRight: () => navigate(booksHref) })

  const readKeys = readChapterKeys()

  return (
    <section className="page">
      <PageHeader title={bookName} subtitle={version ? `${version} · Capítulos` : 'Capítulos'} backTo={booksHref} backLabel="Libros" />
      <StatusMessage loading={loading} error={error} empty={!loading && !error && chapters.length === 0} />
      <ul className="chapter-grid">
        {chapters.map((chapter) => {
          const read = readKeys.has(chapterKey(canonicalId, chapter.chapterNumber))
          return (
            <li key={chapter.chapterId}>
              <a
                className={read ? 'chapter-tile read' : 'chapter-tile'}
                href={`#/chapters/${chapter.chapterId}`}
                aria-label={read ? `Capítulo ${chapter.chapterNumber}, leído` : `Capítulo ${chapter.chapterNumber}`}
              >
                {chapter.chapterNumber}
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
