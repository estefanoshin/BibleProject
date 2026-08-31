import { useEffect, useState } from 'react'
import { fetchChapters } from '../api'
import { PageHeader, StatusMessage } from '../components/PageHeader.jsx'
import { isChapterRead, rememberBookChapters } from '../readProgress'
import { navigate } from '../router'
import { useHorizontalSwipe } from '../useSwipe'

export default function ChaptersPage({ bookId }) {
  const [chapters, setChapters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetchChapters(bookId)
      .then((data) => {
        if (!cancelled) {
          setChapters(data)
          rememberBookChapters(bookId, data.map((chapter) => chapter.chapterId))
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

  return (
    <section className="page">
      <PageHeader title={bookName} subtitle={version ? `${version} · Capítulos` : 'Capítulos'} backTo={booksHref} backLabel="Libros" />
      <StatusMessage loading={loading} error={error} empty={!loading && !error && chapters.length === 0} />
      <ul className="chapter-grid">
        {chapters.map((chapter) => {
          const read = isChapterRead(chapter.chapterId)
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
