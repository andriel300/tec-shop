import type appMessages from '../../messages/en.json';

// Provides type-safe translation key checking for useTranslations() and getTranslations().
// Keys from the shared @tec-shop/i18n library (Common.*, LanguageSwitcher.*)
// are merged at runtime on top of these app-level keys.
declare global {
  interface IntlMessages extends typeof appMessages {}
}
