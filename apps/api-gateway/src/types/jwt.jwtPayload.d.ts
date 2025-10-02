export type AuthJwtPayload = {
  sub: string;          // MongoDB ObjectId is string, not number
  username: string;
  role?: string;        // Add optional role field
  userType?: 'CUSTOMER' | 'SELLER' | 'ADMIN';  // Add user type discrimination
};
