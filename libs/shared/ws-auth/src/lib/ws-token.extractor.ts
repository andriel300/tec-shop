import type { Socket } from 'socket.io';

/**
 * Extracts a JWT from a Socket.IO handshake in priority order:
 *   1. handshake.auth.token     — explicit token (chat flow)
 *   2. Authorization header     — Bearer token
 *   3. httpOnly cookies         — admin/seller/customer access tokens
 *
 * Cookie name format:
 *   dev:  {userType}_access_token
 *   prod: __Host-{userType}_access_token  (set via isProduction flag)
 */

const COOKIE_BASE_NAMES = [
  'admin_access_token',
  'seller_access_token',
  'customer_access_token',
];

export function extractWsToken(client: Socket, isProduction = false): string | null {
  const auth = client.handshake.auth as Record<string, unknown> | undefined;
  if (typeof auth?.token === 'string' && auth.token) {
    return auth.token;
  }

  const authHeader = client.handshake.headers?.authorization;
  if (authHeader) {
    return authHeader.replace('Bearer ', '');
  }

  const cookieHeader = client.handshake.headers?.cookie;
  if (cookieHeader) {
    return extractTokenFromCookies(cookieHeader, isProduction);
  }

  return null;
}

function extractTokenFromCookies(cookieHeader: string, isProduction: boolean): string | null {
  const prefix = isProduction ? '__Host-' : '';
  const cookies = cookieHeader.split(';');

  for (const cookie of cookies) {
    const [rawName, ...valueParts] = cookie.trim().split('=');
    const name = rawName.trim();

    for (const baseName of COOKIE_BASE_NAMES) {
      if (name === `${prefix}${baseName}`) {
        return decodeURIComponent(valueParts.join('='));
      }
    }
  }

  return null;
}
