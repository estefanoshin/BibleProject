// Carries the verse the reader was looking at across a version switch, so the
// new translation opens at the same place instead of at the top.
let pendingVerse = null

function stickyTopOffset() {
  const bar = document.querySelector('.back-bar')
  return (bar ? bar.getBoundingClientRect().height : 0) + 8
}

function verseNodes() {
  return [...document.querySelectorAll('.verses [data-verse]')]
}

export function currentVerseAnchor() {
  const nodes = verseNodes()
  if (nodes.length === 0) {
    return null
  }
  const offset = stickyTopOffset()
  let anchor = Number(nodes[0].dataset.verse)
  for (const node of nodes) {
    if (node.getBoundingClientRect().top > offset) {
      break
    }
    anchor = Number(node.dataset.verse)
  }
  return anchor
}

export function rememberVerseAnchor(verseNumber) {
  const verse = Number(verseNumber)
  pendingVerse = Number.isFinite(verse) ? verse : null
}

export function takeVerseAnchor() {
  const verse = pendingVerse
  pendingVerse = null
  return verse
}

// Translations can split verses differently, so fall back to the closest
// preceding verse when the exact number is missing.
export function scrollToVerse(verseNumber) {
  const nodes = verseNodes()
  if (nodes.length === 0) {
    return false
  }
  let target = null
  for (const node of nodes) {
    if (Number(node.dataset.verse) <= verseNumber) {
      target = node
    } else {
      break
    }
  }
  if (!target) {
    return false
  }
  const top = target.getBoundingClientRect().top + window.scrollY - stickyTopOffset()
  window.scrollTo(0, Math.max(0, top))
  return true
}
