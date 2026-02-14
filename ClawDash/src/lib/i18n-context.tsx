'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Locale, getLocale, setLocale, t, translations } from '@/lib/i18n';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  availableLocales: Locale[];
  mounted: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(getLocale());
    setMounted(true);
  }, []);

  const value = useMemo<I18nContextType>(() => {
    if (!mounted) {
      return {
        locale: 'en' as Locale,
        setLocale: () => {},
        t: (key: string) => key,
        availableLocales: Object.keys(translations) as Locale[],
        mounted: false,
      };
    }
    return {
      locale,
      setLocale: (newLocale: Locale) => {
        setLocaleState(newLocale);
        setLocale(newLocale);
      },
      t: (key: string) => t(locale, key),
      availableLocales: Object.keys(translations) as Locale[],
      mounted: true,
    };
  }, [locale, mounted]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    // Return default values if not in provider
    return {
      locale: 'en' as Locale,
      setLocale: () => {},
      t: (key: string) => key,
      availableLocales: ['zh-TW', 'en'] as Locale[],
      mounted: false,
    };
  }
  return context;
}
