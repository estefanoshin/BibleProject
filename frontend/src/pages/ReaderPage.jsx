import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { fetchChapterVerses, fetchVersions } from '../api'
import { canonicalBookIdFor, chapterIdInVersion } from '../chapterIdentity'
import { resolveChapterNeighbors } from '../chapterNavigation'
import { PageHeader, StatusMessage } from '../components/PageHeader.jsx'
import { chapterKey, isChapterRead, setChapterRead } from '../readProgress'
import {
  currentVerseAnchor,
  rememberVerseAnchor,
  scrollToVerse,
  takeVerseAnchor,
} from '../readerScroll'
import { navigate } from '../router'
import { useHorizontalSwipe } from '../useSwipe'
import { displayVersionName, groupVersions, readButtonLabel, versionLanguage } from '../versionMeta'

const NO_NEIGHBORS = { previous: null, next: null }

export default function ReaderPage({ chapterId }) {
  const [chapter, setChapter] = useState(null)
  const [neighbors, setNeighbors] = useState(NO_NEIGHBORS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [canonicalId, setCanonicalId] = useState(null)
  const [read, setRead] = useState(false)
  const [versions, setVersions] = useState([])
  const anchorRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setNeighbors(NO_NEIGHBORS)
    setCanonicalId(null)
    setRead(false)
    anchorRef.current = takeVerseAnchor()
    fetchChapterVerses(chapterId)
      .then(async (data) => {
        if (cancelled) {
          return
        }
        setChapter(data)
        const canonical = await canonicalBookIdFor(data.version, data.bookId)
        if (!cancelled) {
          setCanonicalId(canonical)
          setRead(isChapterRead(chapterKey(canonical, data.chapterNumber)))
        }
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

  useLayoutEffect(() => {
    if (!chapter) {
      return
    }
    const anchor = anchorRef.current
    anchorRef.current = null
    if (anchor == null || !scrollToVerse(anchor)) {
      window.scrollTo(0, 0)
    }
  }, [chapter])

  useEffect(() => {
    let cancelled = false
    fetchVersions()
      .then((data) => {
        if (!cancelled) {
          setVersions(data)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

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
    const key = chapterKey(canonicalId, chapter?.chapterNumber)
    if (key) {
      setRead(setChapterRead(key, !read))
    }
  }

  async function openInVersion(version) {
    if (!chapter || version === chapter.version) {
      return
    }
    const anchor = currentVerseAnchor()
    const targetId = await chapterIdInVersion(version, canonicalId, chapter.chapterNumber)
    if (!targetId) {
      navigate(`/versions/${encodeURIComponent(version)}/books`)
      return
    }
    rememberVerseAnchor(anchor)
    navigate(`/chapters/${targetId}`)
  }

  const chaptersHref = chapter ? `#/books/${chapter.bookId}/chapters` : '#/'
  const lang = versionLanguage(chapter?.version)

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
              <p key={verse.verseId} data-verse={verse.verseNumber}>
                <sup>{verse.verseNumber}</sup>
                {verse.text}
              </p>
            ))}
          </article>
          <button
            type="button"
            className={read ? 'mark-read-button marked' : 'mark-read-button'}
            aria-pressed={read}
            disabled={!canonicalId}
            onClick={toggleRead}
          >
            {readButtonLabel(lang, read)}
          </button>
          <nav className="chapter-nav">
            <NeighborLink target={neighbors.previous} direction={-1} />
            <NeighborLink target={neighbors.next} direction={1} />
          </nav>
        </>
      ) : null}
      <VersionBar versions={versions} current={chapter?.version} onSelect={openInVersion} />
    </section>
  )
}

function VersionBar({ versions, current, onSelect }) {
  const activeRef = useRef(null)

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [current, versions])

  if (versions.length === 0) {
    return null
  }

  const ordered = groupVersions(versions).flatMap((group) => group.items)

  return (
    <nav className="version-bar" data-swipe-ignore="true" aria-label="Otras versiones">
      <ul className="version-tabs">
        {ordered.map((item) => {
          const active = item.version === current
          return (
            <li key={item.version}>
              <button
                type="button"
                ref={active ? activeRef : null}
                className={active ? 'version-tab active' : 'version-tab'}
                aria-current={active ? 'true' : undefined}
                onClick={() => onSelect(item.version)}
              >
                {displayVersionName(item.version)}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
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
