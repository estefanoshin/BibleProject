// Progress is stored per canonical book + chapter number, so marking a chapter read
// in one translation marks it read in every translation.
const STORAGE_KEY = 'bible.readChapters.v2'
const BOOK_CHAPTERS_KEY = 'bible.bookChapters.v2'

export function chapterKey(canonicalBookId, chapterNumber) {
  const book = Number(canonicalBookId)
  const number = Number(chapterNumber)
  if (!Number.isFinite(book) || !Number.isFinite(number)) {
    return null
  }
  return `${book}:${number}`
}

function readKeys() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return new Set()
    }
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed.map(String) : [])
  } catch {
    return new Set()
  }
}

function writeKeys(keys) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...keys]))
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

export function readChapterKeys() {
  return readKeys()
}

export function isChapterRead(key) {
  return key ? readKeys().has(key) : false
}

export function setChapterRead(key, read) {
  if (!key) {
    return false
  }
  const keys = readKeys()
  if (read) {
    keys.add(key)
  } else {
    keys.delete(key)
  }
  writeKeys(keys)
  return keys.has(key)
}

// A book can only be judged complete once its chapter list has been seen at least once,
// so the chapters page records the numbers it loads.
export function rememberBookChapters(canonicalBookId, chapterNumbers) {
  const book = Number(canonicalBookId)
  const numbers = chapterNumbers.map(Number).filter(Number.isFinite)
  if (!Number.isFinite(book) || numbers.length === 0) {
    return
  }
  const map = readBookChapters()
  map[book] = numbers
  localStorage.setItem(BOOK_CHAPTERS_KEY, JSON.stringify(map))
}

export function readBookIds() {
  const read = readKeys()
  const map = readBookChapters()
  const completed = new Set()
  for (const [bookId, numbers] of Object.entries(map)) {
    if (
      Array.isArray(numbers) &&
      numbers.length > 0 &&
      numbers.every((number) => read.has(chapterKey(bookId, number)))
    ) {
      completed.add(Number(bookId))
    }
  }
  return completed
}
