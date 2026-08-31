import { publicUrl, VERSION_DIRS } from './appConfig.js'

function parseCsv(text) {
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1)
  }
  const rows = []
  let i = 0

  const readRow = () => {
    if (i >= text.length) {
      return null
    }
    const fields = []
    let field = ''
    let quoted = false
    while (i < text.length) {
      const c = text[i]
      if (quoted) {
        if (c === '"') {
          if (text[i + 1] === '"') {
            field += '"'
            i += 2
            continue
          }
          quoted = false
          i += 1
          continue
        }
        field += c
        i += 1
      } else if (c === '"') {
        quoted = true
        i += 1
      } else if (c === ',') {
        fields.push(field)
        field = ''
        i += 1
      } else if (c === '\n') {
        i += 1
        break
      } else if (c === '\r') {
        i += 1
      } else {
        field += c
        i += 1
      }
    }
    fields.push(field)
    return fields
  }

  const header = readRow()
  if (!header) {
    return []
  }
  let record
  while ((record = readRow()) !== null) {
    if (record.length === 1 && record[0] === '') {
      continue
    }
    const row = {}
    for (let col = 0; col < header.length; col += 1) {
      row[header[col]] = record[col] ?? ''
    }
    rows.push(row)
  }
  return rows
}

async function loadCsv(relativePath) {
  const response = await fetch(publicUrl(relativePath))
  if (!response.ok) {
    throw new Error(`No se pudo leer ${relativePath}`)
  }
  return parseCsv(await response.text())
}

export async function loadOfflineBible() {
  const books = []
  const chapters = []
  const verses = []
  let bookOff = 0
  let chapterOff = 0
  let verseOff = 0

  for (const dir of VERSION_DIRS) {
    const bookRows = await loadCsv(`resources/${dir}/books.csv`)
    const chapterRows = await loadCsv(`resources/${dir}/chapters.csv`)
    const verseRows = await loadCsv(`resources/${dir}/versicles.csv`)
    const booksByOriginalId = new Map()

    for (const row of bookRows) {
      const originalId = Number(row.book_id)
      const book = {
        bookId: originalId + bookOff,
        name: row.name,
        version: row.version,
      }
      books.push(book)
      booksByOriginalId.set(originalId, book)
    }

    for (const row of chapterRows) {
      const book = booksByOriginalId.get(Number(row.book_id))
      if (!book) {
        continue
      }
      chapters.push({
        chapterId: Number(row.chapter_id) + chapterOff,
        bookId: book.bookId,
        chapterNumber: Number(row.cNum),
        bookName: book.name,
        version: book.version,
      })
    }

    for (const row of verseRows) {
      const book = booksByOriginalId.get(Number(row.book_id))
      if (!book) {
        continue
      }
      verses.push({
        verseId: Number(row.versicle_id) + verseOff,
        bookId: book.bookId,
        chapterId: Number(row.chapter_id) + chapterOff,
        verseNumber: Number(row.vNum),
        text: row.text_value ?? '',
      })
    }

    bookOff = books.reduce((max, book) => Math.max(max, book.bookId), 0)
    chapterOff = chapters.reduce((max, chapter) => Math.max(max, chapter.chapterId), 0)
    verseOff = verses.reduce((max, verse) => Math.max(max, verse.verseId), 0)
  }

  const booksById = new Map(books.map((book) => [book.bookId, book]))
  const chaptersById = new Map(chapters.map((chapter) => [chapter.chapterId, chapter]))
  const chaptersByBook = new Map()
  for (const chapter of chapters) {
    const list = chaptersByBook.get(chapter.bookId) ?? []
    list.push(chapter)
    chaptersByBook.set(chapter.bookId, list)
  }
  for (const list of chaptersByBook.values()) {
    list.sort((a, b) => a.chapterNumber - b.chapterNumber)
  }
  const versesByChapter = new Map()
  for (const verse of verses) {
    const list = versesByChapter.get(verse.chapterId) ?? []
    list.push(verse)
    versesByChapter.set(verse.chapterId, list)
  }
  for (const list of versesByChapter.values()) {
    list.sort((a, b) => a.verseNumber - b.verseNumber)
  }

  return {
    fetchVersions() {
      const counts = new Map()
      for (const book of books) {
        counts.set(book.version, (counts.get(book.version) ?? 0) + 1)
      }
      return [...counts.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([version, bookCount]) => ({ version, bookCount }))
    },
    fetchBooks(version) {
      return books
        .filter((book) => book.version === version)
        .sort((a, b) => a.bookId - b.bookId)
    },
    fetchChapters(bookId) {
      return [...(chaptersByBook.get(bookId) ?? [])]
    },
    fetchChapterVerses(chapterId) {
      const chapter = chaptersById.get(chapterId)
      if (!chapter) {
        throw new Error('Capítulo no encontrado')
      }
      const inBook = chaptersByBook.get(chapter.bookId) ?? []
      const index = inBook.findIndex((item) => item.chapterId === chapterId)
      return {
        chapterId: chapter.chapterId,
        bookId: chapter.bookId,
        chapterNumber: chapter.chapterNumber,
        bookName: chapter.bookName,
        version: chapter.version,
        previousChapterId: index > 0 ? inBook[index - 1].chapterId : null,
        nextChapterId: index >= 0 && index < inBook.length - 1 ? inBook[index + 1].chapterId : null,
        verses: [...(versesByChapter.get(chapterId) ?? [])],
      }
    },
    fetchBook(bookId) {
      return booksById.get(bookId) ?? null
    },
  }
}
