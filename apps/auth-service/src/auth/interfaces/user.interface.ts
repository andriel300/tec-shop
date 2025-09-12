export interface GoogleUser {
  googleId: string;
  email: string;
  name: string;
  picture: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  tenantId?: string;
  roles: string[];
  isEmailVerified: boolean;
  provider?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  jti: string;
  tenantId?: string;
  roles: string[];
  iat?: number;
  exp?: number;
}
