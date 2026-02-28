import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

const protectedRoutes = ['/profile', '/dashboard', '/settings', '/orders'];
const authRoutes = ['/login', '/signup', '/forgot-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Strip locale prefix to get the actual path for route matching
  const pathnameWithoutLocale =
    pathname.replace(/^\/(en|pt-BR)/, '') || '/';

  const customerAccessToken =
    request.cookies.get('__Host-customer_access_token')?.value ||
    request.cookies.get('customer_access_token')?.value;

  const sellerAccessToken =
    request.cookies.get('__Host-seller_access_token')?.value ||
    request.cookies.get('seller_access_token')?.value;

  const token = customerAccessToken || sellerAccessToken;

  const isProtectedRoute = protectedRoutes.some((r) =>
    pathnameWithoutLocale.startsWith(r)
  );
  const isAuthRoute = authRoutes.some((r) =>
    pathnameWithoutLocale.startsWith(r)
  );

  const localeMatch = pathname.match(/^\/(en|pt-BR)/);
  const locale = localeMatch?.[1] ?? 'en';

  if (isProtectedRoute && !token) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set('redirect', pathnameWithoutLocale);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(en|pt-BR)/:path*', '/((?!api|_next|favicon.ico).*)'],
};
