import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminAuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { email },
    });

    if (!admin || !admin.isActive) {
      throw new UnauthorizedException();
    }

    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) {
      throw new UnauthorizedException();
    }

    return {
      accessToken: this.jwt.sign({
        sub: admin.id,
        role: 'ADMIN',
      }),
    };
  }
}
