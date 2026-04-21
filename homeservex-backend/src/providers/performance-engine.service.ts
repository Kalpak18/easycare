import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PerformanceEngineService {
  constructor(private prisma: PrismaService) {}

  async adjust(providerId: string, delta: number) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: providerId },
      select: { performanceScore: true },
    });

    if (!provider) return;

    let newScore = provider.performanceScore + delta;

    if (newScore > 100) newScore = 100;
    if (newScore < 0) newScore = 0;

    await this.prisma.serviceProvider.update({
      where: { id: providerId },
      data: { performanceScore: newScore },
    });
  }
}
