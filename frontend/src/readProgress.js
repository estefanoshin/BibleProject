import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { CapacitorPersistentAccount } from '@capgo/capacitor-persistent-account'

// Progress is stored per canonical book + chapter number, so marking a chapter read
// in one translation marks it read in every translation.
const STORAGE_KEY = 'bible.readChapters.v2'
const BOOK_CHAPTERS_KEY = 'bible.bookChapters.v2'

const listeners = new Set()

function notify() {
  for (const listener of listeners) {
    listener()
  }
}

export function subscribeReadProgress(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function chapterKey(canonicalBookId, chapterNumber) {
  const book = Number(canonicalBookId)
  const number = Number(chapterNumber)
  if (!Number.isFinite(book) || !Number.isFinite(number)) {
    return null
  }
  return `${book}:${number}`
}

function parseKeySet(value) {
  if (Array.isArray(value)) {
    return new Set(value.map(String))
  }
  if (typeof value !== 'string' || !value) {
    return new Set()
  }
  try {
    const parsed = JSON.parse(value)
    return new Set(Array.isArray(parsed) ? parsed.map(String) : [])
  } catch {
    return new Set()
  }
}

function parseBookMap(value) {
  let parsed = value
  if (typeof value === 'string' && value) {
    try {
      parsed = JSON.parse(value)
    } catch {
      return {}
    }
  }
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
}

function readLocalKeys() {
  try {
    return parseKeySet(localStorage.getItem(STORAGE_KEY))
  } catch {
    return new Set()
  }
}

function readLocalBookChapters() {
  try {
    return parseBookMap(localStorage.getItem(BOOK_CHAPTERS_KEY))
  } catch {
    return {}
  }
}

let chapterKeys = readLocalKeys()
let bookChapters = readLocalBookChapters()
let persistChain = Promise.resolve()

function writeLocal() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...chapterKeys]))
    localStorage.setItem(BOOK_CHAPTERS_KEY, JSON.stringify(bookChapters))
  } catch {
    // Private mode / quota: native store is still updated below.
  }
}

function durablePayload() {
  return {
    readChapters: [...chapterKeys],
    bookChapters,
  }
}

function persistDurable() {
  if (!Capacitor.isNativePlatform()) {
    return persistChain
  }
  persistChain = persistChain
    .then(() => CapacitorPersistentAccount.saveAccount({ data: durablePayload() }))
    .catch(() => {})
  return persistChain
}

function persist() {
  writeLocal()
  persistDurable()
  notify()
}

function mergeBookMaps(primary, extra) {
  const merged = { ...primary }
  for (const [bookId, numbers] of Object.entries(extra)) {
    const current = merged[bookId]
    if (!Array.isArray(current) || (Array.isArray(numbers) && numbers.length > current.length)) {
      merged[bookId] = numbers
    }
  }
  return merged
}

function payloadFromDurable(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null
  }
  // Web implementation of the plugin stores the whole { data } options object.
  if (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data) && raw.readChapters == null) {
    return payloadFromDurable(raw.data)
  }
  return raw
}

export async function hydrateReadProgress() {
  if (Capacitor.isNativePlatform()) {
    try {
      const result = await CapacitorPersistentAccount.readAccount()
      const payload = payloadFromDurable(result?.data)
      if (payload) {
        chapterKeys = new Set([...chapterKeys, ...parseKeySet(payload.readChapters)])
        bookChapters = mergeBookMaps(bookChapters, parseBookMap(payload.bookChapters))
      }
    } catch {
      // Keep local cache if the device store is unavailable.
    }
  }
  writeLocal()
  if (chapterKeys.size > 0 || Object.keys(bookChapters).length > 0) {
    await persistDurable()
  }
  notify()
}

export function readChapterKeys() {
  return chapterKeys
}

export function isChapterRead(key) {
  return key ? chapterKeys.has(key) : false
}

export function setChapterRead(key, read) {
  if (!key) {
    return false
  }
  setChaptersRead([key], read)
  return chapterKeys.has(key)
}

export function setChaptersRead(keys, read) {
  let changed = false
  for (const key of keys) {
    if (!key) {
      continue
    }
    if (read) {
      if (!chapterKeys.has(key)) {
        chapterKeys.add(key)
        changed = true
      }
    } else if (chapterKeys.delete(key)) {
      changed = true
    }
  }
  if (changed) {
    persist()
  }
}

// A book can only be judged complete once its chapter list has been seen at least once,
// so the chapters page records the numbers it loads.
export function rememberBookChapters(canonicalBookId, chapterNumbers) {
  const book = Number(canonicalBookId)
  const numbers = chapterNumbers.map(Number).filter(Number.isFinite)
  if (!Number.isFinite(book) || numbers.length === 0) {
    return
  }
  bookChapters = { ...bookChapters, [book]: numbers }
  persist()
}

export function readBookIds() {
  const read = chapterKeys
  const completed = new Set()
  for (const [bookId, numbers] of Object.entries(bookChapters)) {
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

export function useReadProgress() {
  const [, setTick] = useState(0)
  useEffect(() => subscribeReadProgress(() => setTick((n) => n + 1)), [])
  return { readKeys: chapterKeys, readBooks: readBookIds() }
}
