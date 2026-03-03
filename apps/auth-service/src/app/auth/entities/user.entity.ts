export enum UserType {
  CUSTOMER = 'CUSTOMER',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN',
}

export class User {
  id!: string;
  email!: string;
  password!: string | null;
  isEmailVerified!: boolean;
  userType!: UserType;
  googleId!: string | null;
  provider!: string;
  refreshToken!: string | null;
  isBanned!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
