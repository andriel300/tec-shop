/**
 * Unified JWT payload shape for all WebSocket gateways.
 * Matches the shape produced by JwtStrategy (payload.sub → userId).
 */
export interface WsJwtPayload {
  sub: string;
  username: string;
  userType?: 'CUSTOMER' | 'SELLER' | 'ADMIN';
  role?: string;
  iat?: number;
  exp?: number;
}
