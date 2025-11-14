import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = ['/profile', '/dashboard', '/settings', '/orders'];

// Define auth routes that should redirect to home if user is already authenticated
const authRoutes = ['/login', '/signup', '/forgot-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookies - check both production and development cookie names
  // Backend sets: customer_access_token (dev) or __Host-customer_access_token (prod)
  const customerAccessToken =
    request.cookies.get('__Host-customer_access_token')?.value ||
    request.cookies.get('customer_access_token')?.value;

  const sellerAccessToken =
    request.cookies.get('__Host-seller_access_token')?.value ||
    request.cookies.get('seller_access_token')?.value;

  const token = customerAccessToken || sellerAccessToken;

  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // If trying to access protected route without token
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If trying to access auth routes with valid token
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

