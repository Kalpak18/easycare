import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';
import { addDays } from 'date-fns';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  // ---------- TOKEN HELPERS ----------
  private generateRefreshToken() {
    return randomBytes(64).toString('hex');
  }

  private signAccessToken(id: string, role: Role) {
    return this.jwt.sign({ sub: id, role }, { expiresIn: '15m' });
  }

  // ---------- ISSUE TOKENS ----------
  async issueTokens(params: {
    userId?: string;
    providerId?: string;
    adminId?: string;
    role: Role;
  }) {
    const subject = params.userId || params.providerId || params.adminId;

    const accessToken = this.signAccessToken(subject!, params.role);
    const refreshToken = this.generateRefreshToken();

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: params.userId,
        providerId: params.providerId,
        adminId: params.adminId,
        expiresAt: addDays(new Date(), 30),
      },
    });

    // 👇 FETCH PROVIDER STATUS IF NEEDED
    let isVerified: boolean | null = null;
    let kycStatus: string | null = null;

    if (params.providerId) {
      const provider = await this.prisma.serviceProvider.findUnique({
        where: { id: params.providerId },
        select: {
          isVerified: true,
          documents: { select: { status: true } },
        },
      });

      isVerified = provider?.isVerified ?? false;

      if (provider?.isVerified) {
        kycStatus = 'APPROVED';
      } else if (!provider?.documents?.length) {
        kycStatus = 'NOT_STARTED';
      } else if (provider.documents.some((d) => d.status === 'REJECTED')) {
        kycStatus = 'REJECTED';
      } else {
        kycStatus = 'PENDING';
      }
    }

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      role: params.role,
      isVerified,
      kycStatus,
    };
  }

  // ---------- ROTATE TOKENS ----------
  async refresh(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 🔁 Rotate token
    await this.prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { revoked: true },
    });

    return this.issueTokens({
      userId: stored.userId ?? undefined,
      providerId: stored.providerId ?? undefined,
      adminId: stored.adminId ?? undefined,
      role: stored.userId
        ? Role.USER
        : stored.providerId
          ? Role.PROVIDER
          : Role.ADMIN,
    });
  }

  // ---------- LOGOUT ----------
  async logout(refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { revoked: true },
    });
  }
}
