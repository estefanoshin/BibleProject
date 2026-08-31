import { fetchBooks, fetchChapters } from './api'
import { canonicalBookId } from './bookCatalog'

const booksByVersion = new Map()

function versionBooks(version) {
  let pending = booksByVersion.get(version)
  if (!pending) {
    pending = fetchBooks(version).catch((error) => {
      booksByVersion.delete(version)
      throw error
    })
    booksByVersion.set(version, pending)
  }
  return pending
}

// Resolution is best effort: without it the UI simply cannot show read state.
export async function canonicalBookIdFor(version, bookId) {
  if (!version) {
    return null
  }
  try {
    const books = await versionBooks(version)
    const index = books.findIndex((book) => Number(book.bookId) === Number(bookId))
    return index === -1 ? null : canonicalBookId(books[index], index)
  } catch {
    return null
  }
}

// Same book and chapter number, but in another translation.
export async function chapterIdInVersion(version, canonicalId, chapterNumber) {
  if (!canonicalId) {
    return null
  }
  try {
    const books = await versionBooks(version)
    const index = books.findIndex((book, position) => canonicalBookId(book, position) === canonicalId)
    if (index === -1) {
      return null
    }
    const chapters = await fetchChapters(books[index].bookId)
    const match = chapters.find((chapter) => Number(chapter.chapterNumber) === Number(chapterNumber))
    return match ? match.chapterId : null
  } catch {
    return null
  }
}
