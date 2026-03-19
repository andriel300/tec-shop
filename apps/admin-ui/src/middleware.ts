import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

const protectedRoutes = ['/dashboard'];
const authRoutes = ['/login'];

const localePattern = new RegExp(`^\\/(${routing.locales.join('|')})`);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameWithoutLocale = pathname.replace(localePattern, '') || '/';

  const adminAccessToken =
    request.cookies.get('__Host-admin_access_token')?.value ||
    request.cookies.get('admin_access_token')?.value;

  const locale = pathname.match(localePattern)?.[1] ?? routing.defaultLocale;

  const isProtectedRoute = protectedRoutes.some((r) =>
    pathnameWithoutLocale.startsWith(r)
  );
  const isAuthRoute = authRoutes.some((r) =>
    pathnameWithoutLocale.startsWith(r)
  );

  // Check both presence and basic JWT structure (3 dot-separated segments).
  // A cookie with any arbitrary string bypasses a presence-only check.
  // Full signature verification happens server-side; this is an early UX gate.
  const hasValidJwtStructure = (token: string) => token.split('.').length === 3;
  const isAuthenticated = !!adminAccessToken && hasValidJwtStructure(adminAccessToken);

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('redirect', pathnameWithoutLocale);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(en|pt-BR)/:path*', '/((?!api|_next|favicon.ico).*)'],
};
