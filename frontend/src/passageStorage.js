import { useEffect, useState } from 'react'
import { hydrateDurable, persistDurable } from './durableAccount'

const SAVED_PASSAGES_KEY = 'bible.savedPassages.v1'
const PASSAGE_NOTES_KEY = 'bible.passageNotes.v1'

const listeners = new Set()

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

function persist() {
  writeLocalItems(SAVED_PASSAGES_KEY, savedPassages)
  writeLocalItems(PASSAGE_NOTES_KEY, passageNotes)
  persistDurable({ savedPassages, passageNotes })
  notify()
}

export async function hydratePassageStorage() {
  const payload = await hydrateDurable()
  savedPassages = mergeById(savedPassages, payload.savedPassages)
  passageNotes = mergeById(passageNotes, payload.passageNotes)
  persist()
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

export function savePassage(passage) {
  if (!passage?.verses?.length) {
    return false
  }
  const id = passageId(passage)
  const item = { ...passage, id, savedAt: new Date().toISOString() }
  savedPassages = [item, ...savedPassages.filter((entry) => entry.id !== id)]
  persist()
  return true
}

export function saveVerseNote(passage, note) {
  const text = note.trim()
  const verse = passage?.verses?.[0]
  if (!text || !verse || passage.verses.length !== 1) {
    return false
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

export function updatePassageNote(id, note) {
  const text = note.trim()
  if (!id || !text) {
    return false
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

export function deleteSavedPassage(id) {
  const next = savedPassages.filter((entry) => entry.id !== id)
  if (next.length === savedPassages.length) {
    return false
  }
  savedPassages = next
  persist()
  return true
}

export function deletePassageNote(id) {
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
