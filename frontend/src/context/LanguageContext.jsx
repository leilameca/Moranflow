import { useEffect, useMemo, useState } from 'react'

import { LanguageContext } from './language-context.js'
import { translations } from '../i18n/translations.js'

const STORAGE_KEY = 'moran-studio-language'

const readStoredLocale = () => {
  const stored = window.localStorage.getItem(STORAGE_KEY)

  if (stored === 'en' || stored === 'es') {
    return stored
  }

  return 'es'
}

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState(readStoredLocale)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale)
  }, [locale])

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      toggleLocale: () => setLocale((current) => (current === 'es' ? 'en' : 'es')),
      copy: translations[locale],
    }),
    [locale]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
