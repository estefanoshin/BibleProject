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
    markSelectedRead: 'Marcar como leídos',
    markSelectedUnread: 'Marcar como no leídos',
    selectChapters: 'Seleccionar capítulos',
    selectAll: 'Seleccionar todos',
    selectedSuffix: 'seleccionado',
    readSuffix: 'leído',
    listView: 'Ver lista con nombres completos',
    gridView: 'Ver cuadrícula con abreviaturas',
    changeLanguage: 'Cambiar idioma',
    versionsError: 'No se pudieron cargar las versiones.',
    findBook: 'Buscar libro',
    findBookPlaceholder: 'Buscar un libro…',
    noMatchingBooks: 'Ningún libro coincide con la búsqueda.',
    clearSearch: 'Borrar búsqueda',
    findText: 'Buscar en el capítulo',
    findTextPlaceholder: 'Buscar en el capítulo…',
    findPrevious: 'Coincidencia anterior',
    findNext: 'Siguiente coincidencia',
    booksError: 'No se pudieron cargar los libros.',
    chaptersError: 'No se pudieron cargar los capítulos.',
    chapterError: 'No se pudo cargar el capítulo.',
    passageActions: 'Acciones del pasaje',
    versesSelected: 'versículos seleccionados',
    copyPassage: 'Copiar',
    notePassage: 'Nota',
    savePassage: 'Guardar',
    sharePassage: 'Compartir',
    passageCopied: 'Pasaje copiado',
    passageSaved: 'Pasaje guardado',
    passageSaveError: 'No se pudo guardar',
    shareFallback: 'No se pudo compartir; pasaje copiado',
    addNote: 'Añadir nota',
    notePlaceholder: 'Escribe una nota sobre este versículo…',
    cancel: 'Cancelar',
    saveNote: 'Guardar nota',
    noteSaved: 'Nota guardada',
    noteSingleVerse: 'Las notas son de un solo versículo',
    close: 'Cerrar',
    savedNotes: 'Notas guardadas',
    savedPassages: 'Pasajes guardados',
    verseHasNote: 'Este versículo tiene notas',
    delete: 'Eliminar',
    deleteConfirm: 'Esta acción no se puede deshacer.',
    deleteNoteConfirmTitle: '¿Eliminar esta nota?',
    deletePassageConfirmTitle: '¿Eliminar este pasaje?',
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
    markSelectedRead: 'Mark as read',
    markSelectedUnread: 'Mark as unread',
    selectChapters: 'Select chapters',
    selectAll: 'Select all',
    selectedSuffix: 'selected',
    readSuffix: 'read',
    listView: 'Show list with full names',
    gridView: 'Show grid with abbreviations',
    changeLanguage: 'Change language',
    versionsError: 'Could not load the versions.',
    findBook: 'Find book',
    findBookPlaceholder: 'Find a book…',
    noMatchingBooks: 'No books match that search.',
    clearSearch: 'Clear search',
    findText: 'Find in chapter',
    findTextPlaceholder: 'Find in chapter…',
    findPrevious: 'Previous match',
    findNext: 'Next match',
    booksError: 'Could not load the books.',
    chaptersError: 'Could not load the chapters.',
    chapterError: 'Could not load the chapter.',
    passageActions: 'Passage actions',
    versesSelected: 'verses selected',
    copyPassage: 'Copy',
    notePassage: 'Note',
    savePassage: 'Save',
    sharePassage: 'Share',
    passageCopied: 'Passage copied',
    passageSaved: 'Passage saved',
    passageSaveError: 'Could not save',
    shareFallback: 'Sharing unavailable; passage copied',
    addNote: 'Add note',
    notePlaceholder: 'Write a note about this verse…',
    cancel: 'Cancel',
    saveNote: 'Save note',
    noteSaved: 'Note saved',
    noteSingleVerse: 'Notes are for one verse at a time',
    close: 'Close',
    savedNotes: 'Saved notes',
    savedPassages: 'Saved passages',
    verseHasNote: 'This verse has notes',
    delete: 'Delete',
    deleteConfirm: 'This cannot be undone.',
    deleteNoteConfirmTitle: 'Delete this note?',
    deletePassageConfirmTitle: 'Delete this passage?',
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
    markSelectedRead: '읽음으로 표시',
    markSelectedUnread: '읽지 않음으로 표시',
    selectChapters: '장 선택',
    selectAll: '모두 선택',
    selectedSuffix: '선택됨',
    readSuffix: '읽음',
    listView: '전체 이름 목록으로 보기',
    gridView: '약어 격자로 보기',
    changeLanguage: '언어 변경',
    versionsError: '번역본을 불러오지 못했습니다.',
    findBook: '성경 찾기',
    findBookPlaceholder: '성경 이름 검색…',
    noMatchingBooks: '검색과 일치하는 성경이 없습니다.',
    clearSearch: '검색 지우기',
    findText: '장에서 찾기',
    findTextPlaceholder: '장에서 검색…',
    findPrevious: '이전 일치',
    findNext: '다음 일치',
    booksError: '성경 목록을 불러오지 못했습니다.',
    chaptersError: '장 목록을 불러오지 못했습니다.',
    chapterError: '본문을 불러오지 못했습니다.',
    passageActions: '구절 작업',
    versesSelected: '개 구절 선택됨',
    copyPassage: '복사',
    notePassage: '메모',
    savePassage: '저장',
    sharePassage: '공유',
    passageCopied: '구절을 복사했습니다',
    passageSaved: '구절을 저장했습니다',
    passageSaveError: '저장하지 못했습니다',
    shareFallback: '공유할 수 없어 구절을 복사했습니다',
    addNote: '메모 추가',
    notePlaceholder: '이 절에 대한 메모를 작성하세요…',
    cancel: '취소',
    saveNote: '메모 저장',
    noteSaved: '메모를 저장했습니다',
    noteSingleVerse: '메모는 한 절씩만 저장할 수 있습니다',
    close: '닫기',
    savedNotes: '저장한 메모',
    savedPassages: '저장한 구절',
    verseHasNote: '이 절에 메모가 있습니다',
    delete: '삭제',
    deleteConfirm: '이 작업은 되돌릴 수 없습니다.',
    deleteNoteConfirmTitle: '이 메모를 삭제할까요?',
    deletePassageConfirmTitle: '이 구절을 삭제할까요?',
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

export function markSelectedLabel(lang, count, unread = false) {
  const base = t(lang, unread ? 'markSelectedUnread' : 'markSelectedRead')
  if (!count) {
    return base
  }
  if (lang === KOREAN) {
    return `${count}장 ${base}`
  }
  return `${base} (${count})`
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
