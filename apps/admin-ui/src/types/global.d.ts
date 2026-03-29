import type appMessages from '../../messages/en.json';

// Provides type-safe translation key checking for useTranslations() and getTranslations().
// Keys from the shared @tec-shop/i18n library (Common.*, LanguageSwitcher.*)
// are merged at runtime on top of these app-level keys.
type AppMessages = typeof appMessages;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-empty-interface
  interface IntlMessages extends AppMessages {}
}
