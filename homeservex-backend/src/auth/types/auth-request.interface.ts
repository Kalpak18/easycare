import { Request } from 'express';
import { Role } from '@prisma/client';

export interface JwtPayload {
  sub: string; // providerId / userId
  role: Role;
}

export interface AuthRequest extends Request {
  user: {
    userId: string;
    role: Role;
  };
}
