import { createContext, useContext, useState, useCallback } from 'react';
import es from './es';
import en from './en';

const locales = { es, en };
const STORAGE_KEY = 'bg-helper-lang';

const I18nContext = createContext();

/**
 * Get the initial locale from localStorage or browser settings.
 */
function getInitialLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && locales[stored]) return stored;
  } catch {
    // localStorage not available
  }
  // Default to Spanish since the card data is in Spanish
  const browserLang = navigator.language?.slice(0, 2);
  return locales[browserLang] ? browserLang : 'es';
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(getInitialLocale);

  const setLocale = useCallback((newLocale) => {
    if (locales[newLocale]) {
      setLocaleState(newLocale);
      try {
        localStorage.setItem(STORAGE_KEY, newLocale);
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  const t = useCallback(
    (key, params = {}) => {
      let text = locales[locale]?.[key] || locales.es[key] || key;
      // Replace {param} placeholders
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
      return text;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, locales: Object.keys(locales) }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export default I18nContext;
