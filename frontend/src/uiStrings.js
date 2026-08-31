import { ENGLISH, KOREAN, SPANISH, languageLabel } from './versionMeta'

const STRINGS = {
  [SPANISH]: {
    appTitle: 'Biblia',
    appSubtitle: 'Elige una versión para empezar a leer',
    books: 'Libros',
    chapters: 'Capítulos',
    versions: 'Versiones',
    reading: 'Lectura',
    back: 'Atrás',
    loading: 'Cargando…',
    empty: 'No hay contenido para mostrar.',
    otherVersions: 'Otras versiones',
    otherLanguages: 'Otras',
    markRead: 'Marcar como leído',
    markedRead: 'Marcado como leído',
    readSuffix: 'leído',
    listView: 'Ver lista con nombres completos',
    gridView: 'Ver cuadrícula con abreviaturas',
    changeLanguage: 'Cambiar idioma',
    versionsError: 'No se pudieron cargar las versiones.',
    booksError: 'No se pudieron cargar los libros.',
    chaptersError: 'No se pudieron cargar los capítulos.',
    chapterError: 'No se pudo cargar el capítulo.',
  },
  [ENGLISH]: {
    appTitle: 'Bible',
    appSubtitle: 'Choose a version to start reading',
    books: 'Books',
    chapters: 'Chapters',
    versions: 'Versions',
    reading: 'Reading',
    back: 'Back',
    loading: 'Loading…',
    empty: 'Nothing to show.',
    otherVersions: 'Other versions',
    otherLanguages: 'Other',
    markRead: 'Mark as read',
    markedRead: 'Marked as read',
    readSuffix: 'read',
    listView: 'Show list with full names',
    gridView: 'Show grid with abbreviations',
    changeLanguage: 'Change language',
    versionsError: 'Could not load the versions.',
    booksError: 'Could not load the books.',
    chaptersError: 'Could not load the chapters.',
    chapterError: 'Could not load the chapter.',
  },
  [KOREAN]: {
    appTitle: '성경',
    appSubtitle: '읽을 번역본을 선택하세요',
    books: '성경 목록',
    chapters: '장 목록',
    versions: '번역본',
    reading: '읽기',
    back: '뒤로',
    loading: '불러오는 중…',
    empty: '표시할 내용이 없습니다.',
    otherVersions: '다른 번역본',
    otherLanguages: '기타',
    markRead: '읽음으로 표시',
    markedRead: '읽음으로 표시됨',
    readSuffix: '읽음',
    listView: '전체 이름 목록으로 보기',
    gridView: '약어 격자로 보기',
    changeLanguage: '언어 변경',
    versionsError: '번역본을 불러오지 못했습니다.',
    booksError: '성경 목록을 불러오지 못했습니다.',
    chaptersError: '장 목록을 불러오지 못했습니다.',
    chapterError: '본문을 불러오지 못했습니다.',
  },
}

export function t(lang, key) {
  return STRINGS[lang]?.[key] ?? STRINGS[SPANISH][key] ?? ''
}

export function chapterLabel(lang, number) {
  if (lang === ENGLISH) {
    return `Chapter ${number}`
  }
  if (lang === KOREAN) {
    return `${number}장`
  }
  return `Capítulo ${number}`
}

// "Génesis 3" in western languages, "창세기 3장" in Korean.
export function chapterTitle(lang, bookName, number) {
  if (lang === KOREAN) {
    return `${bookName} ${number}장`
  }
  return `${bookName} ${number}`
}

export function bookCountLabel(lang, count) {
  if (lang === ENGLISH) {
    return `${count} ${count === 1 ? 'book' : 'books'}`
  }
  if (lang === KOREAN) {
    return `${count}권`
  }
  return `${count} ${count === 1 ? 'libro' : 'libros'}`
}

export function readAriaLabel(lang, label, read) {
  return read ? `${label}, ${t(lang, 'readSuffix')}` : label
}

export function readButtonLabel(lang, read) {
  return t(lang, read ? 'markedRead' : 'markRead')
}

export function languageToggleAria(lang) {
  const current = languageLabel(lang)
  if (lang === ENGLISH) {
    return `Language: ${current}. Change language`
  }
  if (lang === KOREAN) {
    return `언어: ${current}. 언어 변경`
  }
  return `Idioma: ${current}. Cambiar idioma`
}
