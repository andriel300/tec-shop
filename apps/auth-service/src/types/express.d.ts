import { AuthUser } from '../auth/interfaces/user.interface';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
