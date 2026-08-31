const STORAGE_KEY = 'bible.booksView'

export const GRID_VIEW = 'grid'
export const LIST_VIEW = 'list'

export function readBooksView() {
  try {
    return localStorage.getItem(STORAGE_KEY) === LIST_VIEW ? LIST_VIEW : GRID_VIEW
  } catch {
    return GRID_VIEW
  }
}

export function writeBooksView(view) {
  try {
    localStorage.setItem(STORAGE_KEY, view === LIST_VIEW ? LIST_VIEW : GRID_VIEW)
  } catch {
    // Sin almacenamiento disponible la preferencia solo dura la sesión.
  }
}
