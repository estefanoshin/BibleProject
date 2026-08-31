const STORAGE_KEY = 'bible.readChapters'
const BOOK_CHAPTERS_KEY = 'bible.bookChapters'

function readIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return new Set()
    }
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed.map(Number) : [])
  } catch {
    return new Set()
  }
}

function writeIds(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

function readBookChapters() {
  try {
    const raw = localStorage.getItem(BOOK_CHAPTERS_KEY)
    if (!raw) {
      return {}
    }
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export function isChapterRead(chapterId) {
  return readIds().has(Number(chapterId))
}

export function setChapterRead(chapterId, read) {
  const ids = readIds()
  const id = Number(chapterId)
  if (read) {
    ids.add(id)
  } else {
    ids.delete(id)
  }
  writeIds(ids)
  return ids.has(id)
}

// A book can only be judged complete once its chapter list has been seen at least once,
// so the chapters page records the list it loads.
export function rememberBookChapters(bookId, chapterIds) {
  const ids = chapterIds.map(Number).filter((id) => Number.isFinite(id))
  if (ids.length === 0) {
    return
  }
  const map = readBookChapters()
  map[Number(bookId)] = ids
  localStorage.setItem(BOOK_CHAPTERS_KEY, JSON.stringify(map))
}

export function readBookIds() {
  const read = readIds()
  const map = readBookChapters()
  const completed = new Set()
  for (const [bookId, chapterIds] of Object.entries(map)) {
    if (Array.isArray(chapterIds) && chapterIds.length > 0 && chapterIds.every((id) => read.has(Number(id)))) {
      completed.add(Number(bookId))
    }
  }
  return completed
}
