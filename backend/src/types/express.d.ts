import { Request } from 'express';

export interface UserPayload {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}
