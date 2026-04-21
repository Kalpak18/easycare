import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalProviders,
      verifiedProviders,
      onlineProviders,
      totalUsers,
      activeJobs,
      todayRequests,
      todayCompleted,
      pendingKyc,
      openDisputes,
      totalRevenue,
      todayRevenue,
    ] = await Promise.all([
      this.prisma.serviceProvider.count(),
      this.prisma.serviceProvider.count({ where: { isVerified: true } }),
      this.prisma.serviceProvider.count({ where: { isOnline: true } }),
      this.prisma.user.count(),
      this.prisma.serviceRequest.count({
        where: { status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_CONFIRMATION'] } },
      }),
      this.prisma.serviceRequest.count({ where: { createdAt: { gte: today } } }),
      this.prisma.serviceRequest.count({
        where: { status: 'COMPLETED', completedAt: { gte: today } },
      }),
      this.prisma.providerDocument.count({ where: { status: 'PENDING' } }),
      this.prisma.dispute.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
      this.prisma.payment.aggregate({
        where: { status: 'PAID' },
        _sum: { platformFee: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'PAID', createdAt: { gte: today } },
        _sum: { platformFee: true },
      }),
    ]);

    return {
      totalProviders,
      verifiedProviders,
      onlineProviders,
      totalUsers,
      activeJobs,
      todayRequests,
      todayCompleted,
      pendingKyc,
      openDisputes,
      totalRevenue: totalRevenue._sum.platformFee ?? 0,
      todayRevenue: todayRevenue._sum.platformFee ?? 0,
    };
  }

  async getRevenue() {
    const days: { date: string; revenue: number; requests: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const start = new Date();
      start.setDate(start.getDate() - i);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      const [revenue, requests] = await Promise.all([
        this.prisma.payment.aggregate({
          where: { status: 'PAID', createdAt: { gte: start, lte: end } },
          _sum: { platformFee: true },
        }),
        this.prisma.serviceRequest.count({
          where: { createdAt: { gte: start, lte: end } },
        }),
      ]);

      days.push({
        date: start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        revenue: revenue._sum.platformFee ?? 0,
        requests,
      });
    }
    return days;
  }

  async getRecentRequests() {
    const requests = await this.prisma.serviceRequest.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        category: { select: { name: true } },
        user: { select: { name: true, phone: true } },
        provider: { select: { name: true } },
      },
    });
    return requests;
  }

  async listDisputes() {
    return this.prisma.dispute.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        request: {
          select: {
            id: true,
            user: { select: { name: true, phone: true } },
            provider: { select: { name: true } },
          },
        },
      },
    });
  }

  async resolveDispute(
    id: string,
    resolution: 'RESOLVED_USER' | 'RESOLVED_PROVIDER' | 'REJECTED',
    note: string,
  ) {
    return this.prisma.dispute.update({
      where: { id },
      data: {
        status: resolution,
        adminNote: note,
        resolutionNote: note,
        resolvedAt: new Date(),
      },
    });
  }

  async getAllRequests(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [total, requests] = await Promise.all([
      this.prisma.serviceRequest.count(),
      this.prisma.serviceRequest.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          assignedAt: true,
          completedAt: true,
          category: { select: { name: true } },
          user: { select: { name: true, phone: true } },
          provider: { select: { name: true, phone: true } },
          payment: { select: { mode: true, status: true, amount: true } },
        },
      }),
    ]);
    return { total, page, limit, requests };
  }
}
