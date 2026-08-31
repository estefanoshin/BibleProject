import { useEffect, useState } from 'react'
import { fetchChapterVerses } from '../api'
import { PageHeader, StatusMessage } from '../components/PageHeader.jsx'
import { isChapterRead, setChapterRead } from '../readProgress'

export default function ReaderPage({ chapterId }) {
  const [chapter, setChapter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [read, setRead] = useState(() => isChapterRead(chapterId))

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetchChapterVerses(chapterId)
      .then((data) => {
        if (!cancelled) {
          setChapter(data)
          window.scrollTo(0, 0)
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
            {chapter.previousChapterId ? (
              <a href={`#/chapters/${chapter.previousChapterId}`}>Capítulo anterior</a>
            ) : (
              <span />
            )}
            {chapter.nextChapterId ? (
              <a href={`#/chapters/${chapter.nextChapterId}`}>Capítulo siguiente</a>
            ) : (
              <span />
            )}
          </nav>
        </>
      ) : null}
    </section>
  )
}
