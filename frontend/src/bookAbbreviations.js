const ABBREVIATIONS = {
  genesis: 'Gn',
  exodo: 'Ex',
  levitico: 'Lv',
  numeros: 'Nm',
  deuteronomio: 'Dt',
  josue: 'Jos',
  jueces: 'Jue',
  rut: 'Rt',
  '1 samuel': '1 S',
  '2 samuel': '2 S',
  '1 reyes': '1 R',
  '2 reyes': '2 R',
  '1 cronicas': '1 Cr',
  '2 cronicas': '2 Cr',
  esdras: 'Esd',
  nehemias: 'Neh',
  ester: 'Est',
  job: 'Job',
  salmos: 'Sal',
  proverbios: 'Pr',
  eclesiastes: 'Ec',
  cantares: 'Cnt',
  'cantar de los cantares': 'Cnt',
  isaias: 'Is',
  jeremias: 'Jer',
  lamentaciones: 'Lm',
  ezequiel: 'Ez',
  daniel: 'Dn',
  oseas: 'Os',
  joel: 'Jl',
  amos: 'Am',
  abdias: 'Abd',
  jonas: 'Jon',
  miqueas: 'Mi',
  nahum: 'Nah',
  habacuc: 'Hab',
  sofonias: 'Sof',
  hageo: 'Hag',
  zacarias: 'Zac',
  malaquias: 'Mal',
  mateo: 'Mt',
  marcos: 'Mr',
  lucas: 'Lc',
  juan: 'Jn',
  hechos: 'Hch',
  'hechos de los apostoles': 'Hch',
  romanos: 'Ro',
  '1 corintios': '1 Co',
  '2 corintios': '2 Co',
  galatas: 'Ga',
  efesios: 'Ef',
  filipenses: 'Fil',
  colosenses: 'Col',
  '1 tesalonicenses': '1 Ts',
  '2 tesalonicenses': '2 Ts',
  '1 timoteo': '1 Ti',
  '2 timoteo': '2 Ti',
  tito: 'Tit',
  filemon: 'Flm',
  hebreos: 'He',
  santiago: 'Stg',
  '1 pedro': '1 P',
  '2 pedro': '2 P',
  '1 juan': '1 Jn',
  '2 juan': '2 Jn',
  '3 juan': '3 Jn',
  judas: 'Jud',
  apocalipsis: 'Ap',
}

function normalize(name) {
  return String(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[.]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function fallback(name) {
  const match = /^([123])\s*(.+)$/.exec(name.trim())
  if (match) {
    return `${match[1]} ${match[2].slice(0, 2)}`
  }
  return name.trim().slice(0, 3)
}

export function bookAbbreviation(name) {
  if (!name) {
    return ''
  }
  return ABBREVIATIONS[normalize(name)] ?? fallback(name)
}
