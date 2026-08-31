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
  if (response.status === 204) {
    return null
  }
  const text = await response.text()
  return text ? JSON.parse(text) : null
}

async function sendJson(base, method, path, body) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || `Request failed (${response.status})`)
  }
  if (response.status === 204) {
    return null
  }
  const text = await response.text()
  return text ? JSON.parse(text) : null
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

async function remoteBase() {
  const config = await loadAppConfig()
  if (config.offline) {
    throw new Error('Remote storage is disabled while offline mode is on')
  }
  return apiBase(config)
}

export async function fetchComments() {
  return getJson(await remoteBase(), '/api/comments')
}

export async function createComment(payload) {
  return sendJson(await remoteBase(), 'POST', '/api/comments', payload)
}

export async function updateComment(id, comment) {
  return sendJson(await remoteBase(), 'PATCH', `/api/comments/${id}`, { comment })
}

export async function removeComment(id) {
  return sendJson(await remoteBase(), 'DELETE', `/api/comments/${id}`)
}

export async function fetchSavedPassages() {
  return getJson(await remoteBase(), '/api/passages')
}

export async function createSavedPassage(payload) {
  return sendJson(await remoteBase(), 'POST', '/api/passages', payload)
}

export async function removeSavedPassage(id) {
  return sendJson(await remoteBase(), 'DELETE', `/api/passages/${id}`)
}

export async function fetchReadProgress() {
  return getJson(await remoteBase(), '/api/read-progress')
}

export async function replaceReadProgress(payload) {
  return sendJson(await remoteBase(), 'PUT', '/api/read-progress', payload)
}
