import { localizedBookAbbr } from './bookCatalog'
import { SPANISH } from './versionMeta'

export function bookAbbreviation(name) {
  return localizedBookAbbr({ name }, SPANISH)
}
