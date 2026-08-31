// Tap-to-copy targets also hold selectable text, so a click that ends a
// selection drag must not be treated as a copy request.
export function hasTextSelection() {
  const selection = window.getSelection()
  return Boolean(selection && !selection.isCollapsed && selection.toString().trim())
}

// The async clipboard API is missing on older mobile browsers and blocked
// outside secure contexts, so we keep the hidden-textarea fallback.
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const input = document.createElement('textarea')
    input.value = text
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.appendChild(input)
    input.select()
    let copied = false
    try {
      copied = document.execCommand('copy')
    } catch {
      copied = false
    }
    input.remove()
    return copied
  }
}
