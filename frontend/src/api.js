import { loadAppConfig } from './appConfig.js'
import { loadOfflineBible } from './offlineBible.js'

let bible

function apiBase(config) {
  if (config.api_url) {
    return config.api_url
  }
  const envUrl = import.meta.env.VITE_API_URL
  if (envUrl) {
    return String(envUrl).replace(/\/$/, '')
  }
  return import.meta.env.DEV ? '' : 'http://localhost:5010'
}

async function getJson(base, path) {
  const response = await fetch(`${base}${path}`)
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || `Request failed (${response.status})`)
  }
  return response.json()
}

function createApiBible(config) {
  const base = apiBase(config)
  return {
    fetchVersions: () => getJson(base, '/api/versions'),
    fetchBooks: (version) => getJson(base, `/api/versions/${encodeURIComponent(version)}/books`),
    fetchBook: (bookId) => getJson(base, `/api/books/${bookId}`),
    fetchChapters: (bookId) => getJson(base, `/api/books/${bookId}/chapters`),
    fetchChapterVerses: (chapterId) => getJson(base, `/api/chapters/${chapterId}/verses`),
  }
}

async function getBible() {
  if (!bible) {
    const config = await loadAppConfig()
    bible = config.offline ? await loadOfflineBible() : createApiBible(config)
  }
  return bible
}

export async function fetchVersions() {
  return (await getBible()).fetchVersions()
}

export async function fetchBooks(version) {
  return (await getBible()).fetchBooks(version)
}

export async function fetchBook(bookId) {
  const book = await (await getBible()).fetchBook?.(Number(bookId))
  return book
}

export async function fetchChapters(bookId) {
  return (await getBible()).fetchChapters(Number(bookId))
}

export async function fetchChapterVerses(chapterId) {
  return (await getBible()).fetchChapterVerses(Number(chapterId))
}
