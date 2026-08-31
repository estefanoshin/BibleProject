import { useEffect, useState } from 'react'
import { t } from './uiStrings'
import { SPANISH, nextBookLanguage, versionLanguage } from './versionMeta'

export function uiLanguage(version) {
  return version ? versionLanguage(version) : SPANISH
}

export function useUiLanguage(version) {
  const lang = uiLanguage(version)

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = t(lang, 'appTitle')
  }, [lang])

  return lang
}

export function useBookPageLanguage(version) {
  const [lang, setLang] = useState(() => uiLanguage(version))

  useEffect(() => {
    setLang(uiLanguage(version))
  }, [version])

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = t(lang, 'appTitle')
  }, [lang])

  return [lang, () => setLang(nextBookLanguage)]
}
