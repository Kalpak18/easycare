import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestStatus } from '@prisma/client';
import { RiskEngineService } from 'src/providers/risk-engine.service';

@Injectable()
export class DisputesService {
  constructor(
    private prisma: PrismaService,
    private riskEngine: RiskEngineService,
  ) {}

  async raiseDispute(requestId: string, userId: string, reason: string) {
    const request = await this.prisma.serviceRequest.findFirst({
      where: {
        id: requestId,
        userId,
        status: 'AWAITING_CONFIRMATION',
      },
    });

    if (!request) {
      throw new ForbiddenException('Cannot raise dispute');
    }

    if (!request.providerId) {
      throw new ForbiddenException('Provider not assigned');
    }

    await this.prisma.serviceRequest.update({
      where: { id: requestId },
      data: { status: RequestStatus.DISPUTED },
    });

    await this.riskEngine.evaluate(request.providerId);

    return this.prisma.dispute.create({
      data: {
        requestId,
        userId,
        providerId: request.providerId, // ✅ now guaranteed string
        raisedBy: 'USER',
        reason,
      },
    });
  }
}
