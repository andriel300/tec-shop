import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

const protectedRoutes = ['/dashboard'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameWithoutLocale = pathname.replace(/^\/(en|pt-BR)/, '') || '/';

  const sellerAccessToken =
    request.cookies.get('__Host-seller_access_token')?.value ||
    request.cookies.get('seller_access_token')?.value;

  const localeMatch = pathname.match(/^\/(en|pt-BR)/);
  const locale = localeMatch?.[1] ?? 'en';

  const isProtectedRoute = protectedRoutes.some((r) =>
    pathnameWithoutLocale.startsWith(r)
  );

  if (isProtectedRoute && !sellerAccessToken) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(en|pt-BR)/:path*', '/((?!api|_next|favicon.ico).*)'],
};
