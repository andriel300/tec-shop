import { getRequestConfig } from 'next-intl/server';
import { routing, getSharedMessages, mergeMessages, type Locale } from '@tec-shop/i18n';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  const sharedMessages = getSharedMessages(locale);
  const appMessages = (await import(`../../messages/${locale}.json`)).default;

  return {
    locale,
    messages: mergeMessages(sharedMessages, appMessages),
  };
});
