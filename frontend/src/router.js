import { useEffect, useState } from 'react'

function parseHash() {
  const raw = window.location.hash.replace(/^#/, '') || '/'
  const path = raw.startsWith('/') ? raw : `/${raw}`
  const parts = path.split('/').filter(Boolean)

  if (parts.length === 0) {
    return { name: 'versions' }
  }
  if (parts[0] === 'versions' && parts[1] && parts[2] === 'books') {
    return { name: 'books', version: decodeURIComponent(parts[1]) }
  }
  if (parts[0] === 'books' && parts[1] && parts[2] === 'chapters') {
    return { name: 'chapters', bookId: Number(parts[1]) }
  }
  if (parts[0] === 'chapters' && parts[1]) {
    return { name: 'reader', chapterId: Number(parts[1]) }
  }
  if (parts[0] === 'notes') {
    return { name: 'notes' }
  }
  if (parts[0] === 'saved') {
    return { name: 'saved' }
  }
  return { name: 'versions' }
}

export function navigate(to) {
  window.location.hash = to.startsWith('#') ? to : `#${to}`
}

export function useRoute() {
  const [route, setRoute] = useState(parseHash)

  useEffect(() => {
    const onChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onChange)
    if (!window.location.hash) {
      window.location.hash = '#/'
    }
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}
