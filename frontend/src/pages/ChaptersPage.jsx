import { useEffect, useState } from 'react'
import { fetchChapters } from '../api'
import { bookNameForId, localizedBookName } from '../bookCatalog'
import { canonicalBookIdFor } from '../chapterIdentity'
import { PageHeader, StatusMessage } from '../components/PageHeader.jsx'
import { chapterKey, rememberBookChapters, useReadProgress } from '../readProgress'
import { navigate } from '../router'
import { useUiLanguage } from '../uiLanguage'
import { chapterLabel, readAriaLabel, t } from '../uiStrings'
import { useHorizontalSwipe } from '../useSwipe'
import { displayVersionName } from '../versionMeta'

export default function ChaptersPage({ bookId }) {
  const [chapters, setChapters] = useState([])
  const [canonicalId, setCanonicalId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [failure, setFailure] = useState(null)
  const { readKeys } = useReadProgress()
  const version = chapters[0]?.version
  const lang = useUiLanguage(version)

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

  useHorizontalSwipe({ onSwipeRight: () => navigate(booksHref) })

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
      />
      <StatusMessage
        loading={loading}
        error={error}
        empty={!loading && !error && chapters.length === 0}
        lang={lang}
      />
      <ul className="chapter-grid">
        {chapters.map((chapter) => {
          const read = readKeys.has(chapterKey(canonicalId, chapter.chapterNumber))
          return (
            <li key={chapter.chapterId}>
              <a
                className={read ? 'chapter-tile read' : 'chapter-tile'}
                href={`#/chapters/${chapter.chapterId}`}
                aria-label={readAriaLabel(lang, chapterLabel(lang, chapter.chapterNumber), read)}
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
