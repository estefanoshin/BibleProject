import { useEffect, useState } from 'react'
import {
  createComment,
  createSavedPassage,
  fetchComments,
  fetchSavedPassages,
  removeComment,
  removeSavedPassage,
  updateComment,
} from './api'
import { usesRemoteStorage } from './appConfig'
import { canonicalBookIdFor } from './chapterIdentity'
import { hydrateDurable, persistDurable } from './durableAccount'

const SAVED_PASSAGES_KEY = 'bible.savedPassages.v1'
const PASSAGE_NOTES_KEY = 'bible.passageNotes.v1'

const listeners = new Set()
let remote = false

function notify() {
  for (const listener of listeners) {
    listener()
  }
}

export function subscribePassages(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function readLocalItems(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(value) ? value : []
  } catch {
    return []
  }
}

function writeLocalItems(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify(items))
  } catch {
    // Private mode / quota: native store is still updated below.
  }
}

function asList(value) {
  return Array.isArray(value) ? value : []
}

function mergeById(primary, extra) {
  const merged = new Map()
  for (const item of [...asList(extra), ...asList(primary)]) {
    if (item && item.id) {
      merged.set(String(item.id), item)
    }
  }
  return [...merged.values()].sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)))
}

let savedPassages = readLocalItems(SAVED_PASSAGES_KEY)
let passageNotes = readLocalItems(PASSAGE_NOTES_KEY)

function persistLocal() {
  writeLocalItems(SAVED_PASSAGES_KEY, savedPassages)
  writeLocalItems(PASSAGE_NOTES_KEY, passageNotes)
  persistDurable({ savedPassages, passageNotes })
  notify()
}

function persist() {
  if (!remote) {
    persistLocal()
    return
  }
  notify()
}

async function noteFromApi(row) {
  const canonicalBookId = (await canonicalBookIdFor(row.version, row.bookId)) ?? row.bookId
  return {
    id: String(row.id),
    note: row.comment,
    savedAt: row.date,
    version: row.version,
    bookId: row.bookId,
    chapterId: row.chapterId,
    canonicalBookId,
    chapterNumber: row.chapterNumber,
    bookName: row.bookName,
    reference: `${row.bookName} ${row.chapterNumber}:${row.verseNumber}`,
    verses: [
      {
        verseId: row.versicleId,
        verseNumber: row.verseNumber,
        text: row.verseText,
      },
    ],
  }
}

function passageFromApi(row) {
  return {
    id: String(row.id),
    savedAt: row.date,
    version: row.version,
    bookId: row.bookId,
    chapterId: row.chapterId,
    canonicalBookId: row.canonicalBookId,
    chapterNumber: row.chapterNumber,
    bookName: row.bookName,
    reference: row.reference,
    verses: asList(row.verses),
  }
}

export async function hydratePassageStorage() {
  remote = await usesRemoteStorage()
  if (remote) {
    try {
      const [comments, passages] = await Promise.all([fetchComments(), fetchSavedPassages()])
      passageNotes = await Promise.all(asList(comments).map(noteFromApi))
      savedPassages = asList(passages).map(passageFromApi)
    } catch {
      passageNotes = []
      savedPassages = []
    }
    notify()
    return
  }
  const payload = await hydrateDurable()
  savedPassages = mergeById(savedPassages, payload.savedPassages)
  passageNotes = mergeById(passageNotes, payload.passageNotes)
  persistLocal()
}

function passageId(passage) {
  return [
    passage.version,
    passage.canonicalBookId,
    passage.chapterNumber,
    passage.verses.map((verse) => verse.verseNumber).join(','),
  ].join(':')
}

export function verseNoteKey(canonicalBookId, chapterNumber, verseNumber) {
  return `${canonicalBookId}:${chapterNumber}:${verseNumber}`
}

export async function savePassage(passage) {
  if (!passage?.verses?.length) {
    return false
  }
  if (remote) {
    const fingerprint = passageId(passage)
    const existing = savedPassages.find((entry) => passageId(entry) === fingerprint)
    if (existing) {
      try {
        await removeSavedPassage(existing.id)
      } catch {
        return false
      }
    }
    try {
      const created = await createSavedPassage({
        version: passage.version,
        bookId: passage.bookId,
        chapterId: Number(passage.chapterId),
        canonicalBookId: passage.canonicalBookId,
        chapterNumber: passage.chapterNumber,
        bookName: passage.bookName,
        reference: passage.reference,
        verses: passage.verses,
      })
      const item = passageFromApi(created)
      savedPassages = [item, ...savedPassages.filter((entry) => entry.id !== existing?.id)]
      persist()
      return true
    } catch {
      return false
    }
  }
  const id = passageId(passage)
  const item = { ...passage, id, savedAt: new Date().toISOString() }
  savedPassages = [item, ...savedPassages.filter((entry) => entry.id !== id)]
  persist()
  return true
}

export async function saveVerseNote(passage, note) {
  const text = note.trim()
  const verse = passage?.verses?.[0]
  if (!text || !verse || passage.verses.length !== 1) {
    return false
  }
  if (remote) {
    try {
      const created = await createComment({
        versicleId: verse.verseId,
        comment: text,
        version: passage.version,
      })
      const item = await noteFromApi(created)
      passageNotes = [item, ...passageNotes]
      persist()
      return true
    } catch {
      return false
    }
  }
  const item = {
    ...passage,
    verses: [verse],
    reference: passage.reference,
    id: `${passageId(passage)}:${Date.now()}`,
    note: text,
    savedAt: new Date().toISOString(),
  }
  passageNotes = [item, ...passageNotes]
  persist()
  return true
}

export async function updatePassageNote(id, note) {
  const text = note.trim()
  if (!id || !text) {
    return false
  }
  if (remote) {
    try {
      const updated = await updateComment(id, text)
      const item = await noteFromApi(updated)
      passageNotes = passageNotes.map((entry) => (entry.id === String(id) ? item : entry))
      persist()
      return true
    } catch {
      return false
    }
  }
  let found = false
  passageNotes = passageNotes.map((entry) => {
    if (entry.id !== id) {
      return entry
    }
    found = true
    return { ...entry, note: text, savedAt: new Date().toISOString() }
  })
  if (!found) {
    return false
  }
  persist()
  return true
}

export async function deleteSavedPassage(id) {
  if (remote) {
    try {
      await removeSavedPassage(id)
    } catch {
      return false
    }
    savedPassages = savedPassages.filter((entry) => entry.id !== String(id))
    persist()
    return true
  }
  const next = savedPassages.filter((entry) => entry.id !== id)
  if (next.length === savedPassages.length) {
    return false
  }
  savedPassages = next
  persist()
  return true
}

export async function deletePassageNote(id) {
  if (remote) {
    try {
      await removeComment(id)
    } catch {
      return false
    }
    passageNotes = passageNotes.filter((entry) => entry.id !== String(id))
    persist()
    return true
  }
  const next = passageNotes.filter((entry) => entry.id !== id)
  if (next.length === passageNotes.length) {
    return false
  }
  passageNotes = next
  persist()
  return true
}

export function usePassageStorage() {
  const [, setTick] = useState(0)
  useEffect(() => subscribePassages(() => setTick((n) => n + 1)), [])
  return { savedPassages, passageNotes }
}
