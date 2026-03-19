import type appMessages from '../../messages/en.json';

// Provides type-safe translation key checking for useTranslations() and getTranslations().
// Keys from the shared @tec-shop/i18n library (Common.signIn, LanguageSwitcher.*)
// are merged at runtime — app-level Common keys below extend that shared set.
declare global {
  interface IntlMessages extends typeof appMessages {}
}
