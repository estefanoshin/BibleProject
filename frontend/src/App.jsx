import { useRoute } from './router'
import VersionsPage from './pages/VersionsPage.jsx'
import BooksPage from './pages/BooksPage.jsx'
import ChaptersPage from './pages/ChaptersPage.jsx'
import ReaderPage from './pages/ReaderPage.jsx'
import { SavedNotesPage, SavedPassagesPage } from './pages/SavedPages.jsx'
import './App.css'

function App() {
  const route = useRoute()

  if (route.name === 'books') {
    return <BooksPage version={route.version} />
  }
  if (route.name === 'chapters') {
    return <ChaptersPage bookId={route.bookId} />
  }
  if (route.name === 'reader') {
    return <ReaderPage chapterId={route.chapterId} />
  }
  if (route.name === 'notes') {
    return <SavedNotesPage />
  }
  if (route.name === 'saved') {
    return <SavedPassagesPage />
  }
  return <VersionsPage />
}

export default App
