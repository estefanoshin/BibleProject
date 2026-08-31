const configured = import.meta.env.VITE_API_URL

export const API_BASE = configured
  ? String(configured).replace(/\/$/, '')
  : import.meta.env.DEV
    ? ''
    : 'http://localhost:5010'

async function getJson(path) {
  const response = await fetch(`${API_BASE}${path}`)
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || `Request failed (${response.status})`)
  }
  return response.json()
}

export function fetchVersions() {
  return getJson('/api/versions')
}

export function fetchBooks(version) {
  return getJson(`/api/versions/${encodeURIComponent(version)}/books`)
}

export function fetchBook(bookId) {
  return getJson(`/api/books/${bookId}`)
}

export function fetchChapters(bookId) {
  return getJson(`/api/books/${bookId}/chapters`)
}

export function fetchChapterVerses(chapterId) {
  return getJson(`/api/chapters/${chapterId}/verses`)
}
