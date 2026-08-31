import { useEffect, useState } from 'react'
import { fetchChapterVerses } from '../api'
import { resolveChapterNeighbors } from '../chapterNavigation'
import { PageHeader, StatusMessage } from '../components/PageHeader.jsx'
import { isChapterRead, setChapterRead } from '../readProgress'
import { navigate } from '../router'
import { useHorizontalSwipe } from '../useSwipe'

const NO_NEIGHBORS = { previous: null, next: null }

export default function ReaderPage({ chapterId }) {
  const [chapter, setChapter] = useState(null)
  const [neighbors, setNeighbors] = useState(NO_NEIGHBORS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [read, setRead] = useState(() => isChapterRead(chapterId))

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setNeighbors(NO_NEIGHBORS)
    fetchChapterVerses(chapterId)
      .then(async (data) => {
        if (cancelled) {
          return
        }
        setChapter(data)
        window.scrollTo(0, 0)
        const resolved = await resolveChapterNeighbors(data)
        if (!cancelled) {
          setNeighbors(resolved)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'No se pudo cargar el capítulo.')
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

  useEffect(() => {
    setRead(isChapterRead(chapterId))
  }, [chapterId])

  useHorizontalSwipe({
    onSwipeLeft: () => goTo(neighbors.next),
    onSwipeRight: () => goTo(neighbors.previous),
  })

  function goTo(target) {
    if (target) {
      navigate(`/chapters/${target.chapterId}`)
    }
  }

  function toggleRead() {
    setRead(setChapterRead(chapterId, !read))
  }

  const chaptersHref = chapter ? `#/books/${chapter.bookId}/chapters` : '#/'

  return (
    <section className="page reader">
      <PageHeader
        title={chapter ? `${chapter.bookName} ${chapter.chapterNumber}` : 'Lectura'}
        subtitle={chapter?.version}
        backTo={chaptersHref}
        backLabel="Capítulos"
      />
      <StatusMessage loading={loading} error={error} empty={!loading && !error && chapter?.verses?.length === 0} />
      {chapter ? (
        <>
          <article className="verses">
            {chapter.verses.map((verse) => (
              <p key={verse.verseId}>
                <sup>{verse.verseNumber}</sup>
                {verse.text}
              </p>
            ))}
          </article>
          <button
            type="button"
            className={read ? 'mark-read-button marked' : 'mark-read-button'}
            aria-pressed={read}
            onClick={toggleRead}
          >
            {read ? 'Marcado como leído' : 'Marcar como leído'}
          </button>
          <nav className="chapter-nav">
            <NeighborLink target={neighbors.previous} direction={-1} />
            <NeighborLink target={neighbors.next} direction={1} />
          </nav>
        </>
      ) : null}
    </section>
  )
}

function NeighborLink({ target, direction }) {
  if (!target) {
    return <span />
  }
  const label = target.otherBook
    ? `${target.bookName} ${target.chapterNumber}`
    : `Capítulo ${target.chapterNumber}`
  return (
    <a href={`#/chapters/${target.chapterId}`}>
      {direction < 0 ? `‹ ${label}` : `${label} ›`}
    </a>
  )
}
