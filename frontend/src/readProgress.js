const STORAGE_KEY = 'bible.readChapters'

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
