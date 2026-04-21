import { Request } from 'express';
import { Role } from '@prisma/client';

export interface AuthRequest extends Request {
  user: {
    userId: string;
    role: Role;
    isVerified?: boolean;
  };
}
