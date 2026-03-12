import { createNavigation } from 'next-intl/navigation';
import type { redirect as NextRedirect } from 'next/navigation';
import type { Locale } from './config';
import { routing } from './config';

interface LocaleNavigateOptions {
  locale?: Locale;
  scroll?: boolean;
}

interface LocaleRouter {
  push(href: string, options?: LocaleNavigateOptions): void;
  replace(href: string, options?: LocaleNavigateOptions): void;
  back(): void;
  forward(): void;
  refresh(): void;
  prefetch(href: string): void;
}

const navigation = createNavigation(routing);

export const Link = navigation.Link;
export const redirect = navigation.redirect as unknown as typeof NextRedirect;
export const usePathname = navigation.usePathname;
export const useRouter = navigation.useRouter as unknown as () => LocaleRouter;
export const getPathname = navigation.getPathname;
