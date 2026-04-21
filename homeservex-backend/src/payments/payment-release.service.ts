import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentReleaseService {
  constructor(private prisma: PrismaService) {}

  async confirmAndRelease(requestId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const request = await tx.serviceRequest.findFirst({
        where: {
          id: requestId,
          userId,
          status: 'AWAITING_CONFIRMATION',
        },
      });

      if (!request) {
        throw new ForbiddenException('Invalid request state');
      }

      // Release funds
      if (request.paymentMode === 'CASH') {
        await tx.walletTransaction.create({
          data: {
            wallet: { connect: { providerId: request.providerId! } },
            type: 'DEBIT',
            amount: request.platformFee,
            reason: 'COMMISSION',
          },
        });
      } else {
        await tx.walletTransaction.create({
          data: {
            wallet: { connect: { providerId: request.providerId! } },
            type: 'CREDIT',
            amount: request.providerAmount,
            reason: 'JOB_PAYMENT',
          },
        });
      }

      await tx.serviceRequest.update({
        where: { id: requestId },
        data: { status: 'COMPLETED' },
      });

      return { success: true };
    });
  }
}
