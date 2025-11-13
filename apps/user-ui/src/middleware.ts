import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = ['/profile', '/dashboard', '/settings', '/orders'];

// Define auth routes that should redirect to home if user is already authenticated
const authRoutes = ['/login', '/signup', '/forgot-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Debug logging
  console.log('[Middleware] Request to:', pathname);
  console.log('[Middleware] All cookies:', request.cookies.getAll().map(c => c.name));

  // Get token from cookies - check both production and development cookie names
  // Backend sets: customer_access_token (dev) or __Host-customer_access_token (prod)
  const customerAccessToken =
    request.cookies.get('__Host-customer_access_token')?.value ||
    request.cookies.get('customer_access_token')?.value;

  const sellerAccessToken =
    request.cookies.get('__Host-seller_access_token')?.value ||
    request.cookies.get('seller_access_token')?.value;

  const token = customerAccessToken || sellerAccessToken;

  console.log('[Middleware] Customer token found:', !!customerAccessToken);
  console.log('[Middleware] Seller token found:', !!sellerAccessToken);
  console.log('[Middleware] Final token:', !!token);

  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  console.log('[Middleware] Is protected route:', isProtectedRoute);
  console.log('[Middleware] Is auth route:', isAuthRoute);

  // If trying to access protected route without token
  if (isProtectedRoute && !token) {
    console.log('[Middleware] REDIRECTING to /login - no token found for protected route');
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If trying to access auth routes with valid token
  if (isAuthRoute && token) {
    console.log('[Middleware] REDIRECTING to / - already authenticated');
    return NextResponse.redirect(new URL('/', request.url));
  }

  console.log('[Middleware] ALLOWING access to:', pathname);
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