import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { translations, LANGS } from './translations';

const I18nContext = createContext({ lang: 'en', t: (k, r) => k, setLang: () => {} });

export function useT() {
  return useContext(I18nContext);
}

const cached = {};

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('rakshak_lang') || 'en'; } catch { return 'en'; }
  });

  const dict = useMemo(() => {
    if (cached[lang]) return cached[lang];
    const base = translations.en || {};
    const l = translations[lang] || {};
    const merged = { ...base, ...l };
    cached[lang] = merged;
    return merged;
  }, [lang]);

  const t = useCallback((key, vars) => {
    let str = dict[key];
    if (str === undefined || str === null || str === '') str = key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return str;
  }, [dict]);

  const changeLang = useCallback((code) => {
    setLang(code);
    try { localStorage.setItem('rakshak_lang', code); } catch { /* ignore */ }
  }, []);

  const value = useMemo(() => ({ lang, t, setLang: changeLang }), [lang, t, changeLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function listLanguages() {
  return LANGS.map(([code, name, native]) => ({ code, name, native }));
}