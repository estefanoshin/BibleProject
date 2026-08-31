import { ENGLISH, KOREAN, SPANISH } from './versionMeta'

const BOOKS = [
  [1, 'ot', 'Génesis', 'Gn', 'Genesis', 'Gen', '창세기', '창'],
  [2, 'ot', 'Éxodo', 'Ex', 'Exodus', 'Exod', '출애굽기', '출'],
  [3, 'ot', 'Levítico', 'Lv', 'Leviticus', 'Lev', '레위기', '레'],
  [4, 'ot', 'Números', 'Nm', 'Numbers', 'Num', '민수기', '민'],
  [5, 'ot', 'Deuteronomio', 'Dt', 'Deuteronomy', 'Deut', '신명기', '신'],
  [6, 'ot', 'Josué', 'Jos', 'Joshua', 'Josh', '여호수아', '수'],
  [7, 'ot', 'Jueces', 'Jue', 'Judges', 'Judg', '사사기', '삿'],
  [8, 'ot', 'Rut', 'Rt', 'Ruth', 'Ruth', '룻기', '룻'],
  [9, 'ot', '1 Samuel', '1 S', '1 Samuel', '1 Sam', '사무엘상', '삼상'],
  [10, 'ot', '2 Samuel', '2 S', '2 Samuel', '2 Sam', '사무엘하', '삼하'],
  [11, 'ot', '1 Reyes', '1 R', '1 Kings', '1 Kgs', '열왕기상', '왕상'],
  [12, 'ot', '2 Reyes', '2 R', '2 Kings', '2 Kgs', '열왕기하', '왕하'],
  [13, 'ot', '1 Crónicas', '1 Cr', '1 Chronicles', '1 Chr', '역대상', '대상'],
  [14, 'ot', '2 Crónicas', '2 Cr', '2 Chronicles', '2 Chr', '역대하', '대하'],
  [15, 'ot', 'Esdras', 'Esd', 'Ezra', 'Ezra', '에스라', '스'],
  [16, 'ot', 'Nehemías', 'Neh', 'Nehemiah', 'Neh', '느헤미야', '느'],
  [17, 'ot', 'Ester', 'Est', 'Esther', 'Esth', '에스더', '에'],
  [18, 'ot', 'Job', 'Job', 'Job', 'Job', '욥기', '욥'],
  [19, 'ot', 'Salmos', 'Sal', 'Psalms', 'Ps', '시편', '시'],
  [20, 'ot', 'Proverbios', 'Pr', 'Proverbs', 'Prov', '잠언', '잠'],
  [21, 'ot', 'Eclesiastés', 'Ec', 'Ecclesiastes', 'Eccl', '전도서', '전'],
  [22, 'ot', 'Cantares', 'Cnt', 'Song of Songs', 'Song', '아가', '아'],
  [23, 'ot', 'Isaías', 'Is', 'Isaiah', 'Isa', '이사야', '사'],
  [24, 'ot', 'Jeremías', 'Jer', 'Jeremiah', 'Jer', '예레미야', '렘'],
  [25, 'ot', 'Lamentaciones', 'Lm', 'Lamentations', 'Lam', '예레미야애가', '애'],
  [26, 'ot', 'Ezequiel', 'Ez', 'Ezekiel', 'Ezek', '에스겔', '겔'],
  [27, 'ot', 'Daniel', 'Dn', 'Daniel', 'Dan', '다니엘', '단'],
  [28, 'ot', 'Oseas', 'Os', 'Hosea', 'Hos', '호세아', '호'],
  [29, 'ot', 'Joel', 'Jl', 'Joel', 'Joel', '요엘', '욜'],
  [30, 'ot', 'Amós', 'Am', 'Amos', 'Amos', '아모스', '암'],
  [31, 'ot', 'Abdías', 'Abd', 'Obadiah', 'Obad', '오바댜', '옵'],
  [32, 'ot', 'Jonás', 'Jon', 'Jonah', 'Jonah', '요나', '욘'],
  [33, 'ot', 'Miqueas', 'Mi', 'Micah', 'Mic', '미가', '미'],
  [34, 'ot', 'Nahúm', 'Nah', 'Nahum', 'Nah', '나훔', '나'],
  [35, 'ot', 'Habacuc', 'Hab', 'Habakkuk', 'Hab', '하박국', '합'],
  [36, 'ot', 'Sofonías', 'Sof', 'Zephaniah', 'Zeph', '스바냐', '습'],
  [37, 'ot', 'Hageo', 'Hag', 'Haggai', 'Hag', '학개', '학'],
  [38, 'ot', 'Zacarías', 'Zac', 'Zechariah', 'Zech', '스가랴', '슥'],
  [39, 'ot', 'Malaquías', 'Mal', 'Malachi', 'Mal', '말라기', '말'],
  [40, 'nt', 'Mateo', 'Mt', 'Matthew', 'Matt', '마태복음', '마'],
  [41, 'nt', 'Marcos', 'Mr', 'Mark', 'Mark', '마가복음', '막'],
  [42, 'nt', 'Lucas', 'Lc', 'Luke', 'Luke', '누가복음', '눅'],
  [43, 'nt', 'Juan', 'Jn', 'John', 'John', '요한복음', '요'],
  [44, 'nt', 'Hechos', 'Hch', 'Acts', 'Acts', '사도행전', '행'],
  [45, 'nt', 'Romanos', 'Ro', 'Romans', 'Rom', '로마서', '롬'],
  [46, 'nt', '1 Corintios', '1 Co', '1 Corinthians', '1 Cor', '고린도전서', '고전'],
  [47, 'nt', '2 Corintios', '2 Co', '2 Corinthians', '2 Cor', '고린도후서', '고후'],
  [48, 'nt', 'Gálatas', 'Ga', 'Galatians', 'Gal', '갈라디아서', '갈'],
  [49, 'nt', 'Efesios', 'Ef', 'Ephesians', 'Eph', '에베소서', '엡'],
  [50, 'nt', 'Filipenses', 'Fil', 'Philippians', 'Phil', '빌립보서', '빌'],
  [51, 'nt', 'Colosenses', 'Col', 'Colossians', 'Col', '골로새서', '골'],
  [52, 'nt', '1 Tesalonicenses', '1 Ts', '1 Thessalonians', '1 Thess', '데살로니가전서', '살전'],
  [53, 'nt', '2 Tesalonicenses', '2 Ts', '2 Thessalonians', '2 Thess', '데살로니가후서', '살후'],
  [54, 'nt', '1 Timoteo', '1 Ti', '1 Timothy', '1 Tim', '디모데전서', '딤전'],
  [55, 'nt', '2 Timoteo', '2 Ti', '2 Timothy', '2 Tim', '디모데후서', '딤후'],
  [56, 'nt', 'Tito', 'Tit', 'Titus', 'Titus', '디도서', '딛'],
  [57, 'nt', 'Filemón', 'Flm', 'Philemon', 'Phlm', '빌레몬서', '몬'],
  [58, 'nt', 'Hebreos', 'He', 'Hebrews', 'Heb', '히브리서', '히'],
  [59, 'nt', 'Santiago', 'Stg', 'James', 'Jas', '야고보서', '약'],
  [60, 'nt', '1 Pedro', '1 P', '1 Peter', '1 Pet', '베드로전서', '벧전'],
  [61, 'nt', '2 Pedro', '2 P', '2 Peter', '2 Pet', '베드로후서', '벧후'],
  [62, 'nt', '1 Juan', '1 Jn', '1 John', '1 John', '요한일서', '요일'],
  [63, 'nt', '2 Juan', '2 Jn', '2 John', '2 John', '요한이서', '요이'],
  [64, 'nt', '3 Juan', '3 Jn', '3 John', '3 John', '요한삼서', '요삼'],
  [65, 'nt', 'Judas', 'Jud', 'Jude', 'Jude', '유다서', '유'],
  [66, 'nt', 'Apocalipsis', 'Ap', 'Revelation', 'Rev', '요한계시록', '계'],
]

function normalize(name) {
  return String(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const NAME_ALIASES = {
  'cantar de los cantares': 22,
  'song of solomon': 22,
  'hechos de los apostoles': 44,
  psalm: 19,
  psalms: 19,
}

// Protestant chapter counts, used to mark a whole book read before its chapters page is opened.
const CHAPTER_COUNTS = {
  1: 50, 2: 40, 3: 27, 4: 36, 5: 34, 6: 24, 7: 21, 8: 4, 9: 31, 10: 24,
  11: 22, 12: 25, 13: 29, 14: 36, 15: 10, 16: 13, 17: 10, 18: 42, 19: 150,
  20: 31, 21: 12, 22: 8, 23: 66, 24: 52, 25: 5, 26: 48, 27: 12, 28: 14,
  29: 3, 30: 9, 31: 1, 32: 4, 33: 7, 34: 3, 35: 3, 36: 3, 37: 2, 38: 14,
  39: 4, 40: 28, 41: 16, 42: 24, 43: 21, 44: 28, 45: 16, 46: 16, 47: 13,
  48: 6, 49: 6, 50: 4, 51: 4, 52: 5, 53: 3, 54: 6, 55: 4, 56: 3, 57: 1,
  58: 13, 59: 5, 60: 5, 61: 3, 62: 5, 63: 1, 64: 1, 65: 1, 66: 22,
}

const catalog = BOOKS.map(([id, testament, esName, esAbbr, enName, enAbbr, koName, koAbbr]) => ({
  id,
  testament,
  chapterCount: CHAPTER_COUNTS[id],
  [SPANISH]: { name: esName, abbr: esAbbr },
  [ENGLISH]: { name: enName, abbr: enAbbr },
  [KOREAN]: { name: koName, abbr: koAbbr },
}))

const byId = new Map(catalog.map((book) => [book.id, book]))
const byNormalizedName = new Map()

for (const book of catalog) {
  for (const lang of [SPANISH, ENGLISH, KOREAN]) {
    byNormalizedName.set(normalize(book[lang].name), book)
  }
}
for (const [alias, id] of Object.entries(NAME_ALIASES)) {
  byNormalizedName.set(alias, byId.get(id))
}

function fallbackAbbr(name) {
  const match = /^([123])\s*(.+)$/.exec(String(name).trim())
  if (match) {
    return `${match[1]} ${match[2].slice(0, 2)}`
  }
  return String(name).trim().slice(0, 3)
}

export function catalogEntry(book, index) {
  if (book?.sourceBookId && byId.has(book.sourceBookId)) {
    return byId.get(book.sourceBookId)
  }
  const fromName = byNormalizedName.get(normalize(book?.name ?? ''))
  if (fromName) {
    return fromName
  }
  if (Number.isInteger(index) && catalog[index]) {
    return catalog[index]
  }
  return null
}

export function bookMatchesQuery(book, index, query) {
  const needle = normalize(query)
  if (!needle) {
    return true
  }
  const entry = catalogEntry(book, index)
  const haystacks = [book?.name, book?.abbreviation]
  if (entry) {
    for (const lang of [SPANISH, ENGLISH, KOREAN]) {
      haystacks.push(entry[lang]?.name, entry[lang]?.abbr)
    }
  }
  return haystacks.some((value) => value && normalize(value).includes(needle))
}

// Stable id for the same book across versions and languages.
export function canonicalBookId(book, index) {
  return catalogEntry(book, index)?.id ?? null
}

export function canonicalChapterNumbers(canonicalId) {
  const count = byId.get(Number(canonicalId))?.chapterCount
  if (!count) {
    return []
  }
  return Array.from({ length: count }, (_, index) => index + 1)
}

export function localizedBookName(book, lang, index) {
  const entry = catalogEntry(book, index)
  return entry?.[lang]?.name ?? book?.name ?? ''
}

// For pages that already resolved the canonical id and only have the source name.
export function bookNameForId(canonicalId, lang, fallbackName = '') {
  return byId.get(canonicalId)?.[lang]?.name ?? fallbackName
}

export function localizedBookAbbr(book, lang, index) {
  const entry = catalogEntry(book, index)
  return entry?.[lang]?.abbr ?? fallbackAbbr(localizedBookName(book, lang, index) || book?.name)
}

export function isOldTestament(book, index) {
  const entry = catalogEntry(book, index)
  if (entry) {
    return entry.testament === 'ot'
  }
  return index < 39
}

export function testamentLabel(lang, testament) {
  if (lang === ENGLISH) {
    return testament === 'ot' ? 'Old Testament' : 'New Testament'
  }
  if (lang === KOREAN) {
    return testament === 'ot' ? '구약' : '신약'
  }
  return testament === 'ot' ? 'Antiguo Testamento' : 'Nuevo Testamento'
}

export function splitByTestament(books) {
  const oldTestament = []
  const newTestament = []
  books.forEach((book, index) => {
    if (isOldTestament(book, index)) {
      oldTestament.push({ book, index })
    } else {
      newTestament.push({ book, index })
    }
  })
  return { oldTestament, newTestament }
}
