import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RiskEngineService } from '../providers/risk-engine.service';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private riskEngine: RiskEngineService,
  ) {}

  async createReview(
    requestId: string,
    userId: string,
    rating: number,
    comment?: string,
  ) {
    const request = await this.prisma.serviceRequest.findFirst({
      where: {
        id: requestId,
        userId,
        status: 'COMPLETED',
      },
    });

    if (!request || !request.providerId) {
      throw new ForbiddenException('Invalid review request');
    }

    const existing = await this.prisma.review.findUnique({
      where: { requestId },
    });

    if (existing) {
      throw new ForbiddenException('Review already submitted');
    }

    const review = await this.prisma.review.create({
      data: {
        requestId,
        rating,
        comment,
      },
    });

    await this.updateProviderRating(request.providerId, rating);

    return review;
  }

  private async updateProviderRating(providerId: string, newRating: number) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) return;

    const totalCompleted = provider.completedJobs + 1;

    const newAverage =
      (provider.rating * provider.completedJobs + newRating) / totalCompleted;

    await this.prisma.serviceProvider.update({
      where: { id: providerId },
      data: {
        rating: Number(newAverage.toFixed(2)),
      },
    });

    // 🔥 Always re-evaluate risk after rating update
    await this.riskEngine.evaluate(providerId);
  }
}
