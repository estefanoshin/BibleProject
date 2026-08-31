import { fetchBooks, fetchChapters } from './api'

async function chapterInAdjacentBook(version, bookId, direction) {
  const books = await fetchBooks(version)
  const index = books.findIndex((book) => book.bookId === bookId)
  if (index === -1) {
    return null
  }
  const book = books[index + direction]
  if (!book) {
    return null
  }
  const chapters = await fetchChapters(book.bookId)
  if (chapters.length === 0) {
    return null
  }
  const target = direction < 0 ? chapters[chapters.length - 1] : chapters[0]
  return {
    chapterId: target.chapterId,
    bookName: target.bookName ?? book.name,
    chapterNumber: target.chapterNumber,
    otherBook: true,
  }
}

async function neighbor(chapter, direction) {
  const sameBookId = direction < 0 ? chapter.previousChapterId : chapter.nextChapterId
  if (sameBookId) {
    return {
      chapterId: sameBookId,
      bookName: chapter.bookName,
      chapterNumber: chapter.chapterNumber + direction,
      otherBook: false,
    }
  }
  return chapterInAdjacentBook(chapter.version, chapter.bookId, direction)
}

export async function resolveChapterNeighbors(chapter) {
  const [previous, next] = await Promise.all([neighbor(chapter, -1), neighbor(chapter, 1)])
  return { previous, next }
}
