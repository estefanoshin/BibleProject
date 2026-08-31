export const SPANISH = 'es'
export const ENGLISH = 'en'
export const KOREAN = 'ko'

export const BOOK_LANGUAGES = [SPANISH, ENGLISH, KOREAN]

const LANGUAGE_GROUPS = [
  {
    id: SPANISH,
    label: 'Español',
    order: ['RV1960', 'RVA2015', 'DHH', 'NVI', 'NTV'],
  },
  {
    id: ENGLISH,
    label: 'English',
    order: ['KJV', 'NLT'],
  },
  {
    id: KOREAN,
    label: '한국어',
    order: ['KOREV', 'KOERV', 'KLV', 'KLB'],
  },
]

const DISPLAY_NAMES = {
  RV1960: 'RV1960',
  RVA2015: 'RVA2015',
  KOREV: 'KOREV',
  KOERV: 'KOREV',
  KLB: 'KLV',
  KLV: 'KLV',
}

function normalizeVersion(version) {
  return String(version ?? '')
    .replace(/-/g, '')
    .replace(/\s+/g, '')
    .toUpperCase()
}

const languageByVersion = new Map()
const orderByVersion = new Map()

for (const group of LANGUAGE_GROUPS) {
  group.order.forEach((code, index) => {
    languageByVersion.set(code, group.id)
    if (!orderByVersion.has(code)) {
      orderByVersion.set(code, index)
    }
  })
}

export function versionLanguage(version) {
  return languageByVersion.get(normalizeVersion(version)) ?? SPANISH
}

export function displayVersionName(version) {
  const key = normalizeVersion(version)
  return DISPLAY_NAMES[key] ?? version
}

export function languageLabel(lang) {
  if (lang === ENGLISH) {
    return 'EN'
  }
  if (lang === KOREAN) {
    return 'KO'
  }
  return 'ES'
}

const READ_LABELS = {
  [SPANISH]: { unread: 'Marcar como leído', read: 'Marcado como leído' },
  [ENGLISH]: { unread: 'Mark as read', read: 'Marked as read' },
  [KOREAN]: { unread: '읽음으로 표시', read: '읽음으로 표시됨' },
}

export function readButtonLabel(lang, read) {
  const labels = READ_LABELS[lang] ?? READ_LABELS[SPANISH]
  return read ? labels.read : labels.unread
}

export function nextBookLanguage(lang) {
  const index = BOOK_LANGUAGES.indexOf(lang)
  return BOOK_LANGUAGES[(index + 1) % BOOK_LANGUAGES.length]
}

export function groupVersions(versions) {
  const buckets = new Map(LANGUAGE_GROUPS.map((group) => [group.id, []]))
  const other = []

  for (const item of versions) {
    const lang = languageByVersion.get(normalizeVersion(item.version))
    if (lang) {
      buckets.get(lang).push(item)
    } else {
      other.push(item)
    }
  }

  const sortGroup = (items) =>
    [...items].sort((a, b) => {
      const aKey = normalizeVersion(a.version)
      const bKey = normalizeVersion(b.version)
      const aOrder = orderByVersion.get(aKey) ?? 99
      const bOrder = orderByVersion.get(bKey) ?? 99
      if (aOrder !== bOrder) {
        return aOrder - bOrder
      }
      return aKey.localeCompare(bKey)
    })

  const groups = LANGUAGE_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    items: sortGroup(buckets.get(group.id)),
  })).filter((group) => group.items.length > 0)

  if (other.length > 0) {
    groups.push({ id: 'other', label: 'Otras', items: sortGroup(other) })
  }
  return groups
}
