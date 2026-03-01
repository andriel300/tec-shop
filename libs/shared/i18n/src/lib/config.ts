import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'pt-BR'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const routing = defineRouting({
  locales,
  defaultLocale,
});
