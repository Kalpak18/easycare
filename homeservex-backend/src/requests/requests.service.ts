/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, Inject, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getDistanceInKm } from '../common/utils/distance';
import Redis from 'ioredis';
import { RealtimeService } from 'src/realtime/realtime.service';
import { PaymentEngineService } from 'src/payments/payment-engine.service';
import { RiskEngineService } from 'src/providers/risk-engine.service';
import { ProvidersService } from 'src/providers/providers.service';
import { uploadToCloudinary } from '../common/cloudinary/cloudinary.service';
import { PaymentMode } from '@prisma/client';

@Injectable()
export class RequestsService {
  constructor(
    private prisma: PrismaService,
    @Inject('REDIS_CLIENT') private redis: Redis,
    private realtimeService: RealtimeService,
    private paymentEngine: PaymentEngineService,
    private riskEngine: RiskEngineService,
    private providersService: ProvidersService,
  ) {}

  private async calculateSurgeMultiplier(categoryId: string): Promise<number> {
    try {
      const openRequests = await this.prisma.serviceRequest.count({
        where: { categoryId, status: 'OPEN' },
      });

      const redisKey = `providers:${categoryId}`;
      const providers = await this.redis.hgetall(redisKey);

      const availableProviders = Object.keys(providers).length;
      if (availableProviders === 0) return 2.0;
      const ratio = openRequests / availableProviders;
      if (ratio < 1.5) return 1.0;
      if (ratio < 2) return 1.2;
      if (ratio < 3) return 1.5;
      return 2.0;
    } catch {
      // Redis unavailable or DB error — default to no surge
      return 1.0;
    }
  }

  async uploadImage(base64: string): Promise<string> {
    return uploadToCloudinary(base64, 'request-images');
  }

  async createRequest(userId: string, data: any) {
    // --------------------------------------------------
    // 1️⃣ Validate category
    // --------------------------------------------------

    const category = await this.prisma.serviceCategory.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Invalid service category');
    }

    // --------------------------------------------------
    // 2️⃣ Limit user open requests
    // --------------------------------------------------

    const openCount = await this.prisma.serviceRequest.count({
      where: {
        userId,
        status: 'OPEN',
      },
    });

    if (openCount >= 3) {
      throw new BadRequestException('Too many open requests');
    }

    // --------------------------------------------------
    // 3️⃣ Calculate surge multiplier
    // --------------------------------------------------

    const surgeMultiplier = await this.calculateSurgeMultiplier(
      data.categoryId,
    );

    // Optional: if you pass estimated amount from frontend
    const baseAmount =
      typeof data.estimatedAmount === 'number' ? data.estimatedAmount : 0;

    const surgedAmount = baseAmount * surgeMultiplier;

    // --------------------------------------------------
    // 4️⃣ Create request
    // --------------------------------------------------

    const request = await this.prisma.serviceRequest.create({
      data: {
        userId,
        categoryId: data.categoryId,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        paymentMode: data.paymentMode,
        status: 'OPEN',
        preferredSource: data.preferredSource ?? null,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        serviceMetadata: data.serviceMetadata ?? null,

        totalAmount: surgedAmount,
        providerAmount: 0,
        platformFee: 0,
      },
    });

    // --------------------------------------------------
    // 4b️⃣ Save uploaded images if provided
    // --------------------------------------------------

    if (Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
      await this.prisma.serviceRequestImage.createMany({
        data: (data.imageUrls as string[]).map((imageUrl: string) => ({
          requestId: request.id,
          imageUrl,
        })),
      });
    }

    // --------------------------------------------------
    // 5️⃣ Smart matching
    // --------------------------------------------------
    // Best-effort Redis tracking — don't let failure block request creation
    try {
      await this.redis.set(
        `request:broadcast:${request.id}`,
        Date.now().toString(),
        'EX',
        120,
      );
    } catch { /* Redis unavailable */ }

    let matchedProviders = await this.getTopProviders(
      data.categoryId,
      data.latitude,
      data.longitude,
    );

    // Filter by preferred source if specified; fallback to all if none found
    if (data.preferredSource) {
      const filtered = matchedProviders.filter(
        (p) => p.source === data.preferredSource,
      );
      if (filtered.length > 0) matchedProviders = filtered;
    }

    for (const p of matchedProviders.slice(0, 5)) {
      try {
        this.realtimeService.emitNewRequest(p.id, {
          requestId: request.id,
          categoryId: request.categoryId,
          description: request.description,
          lat: request.latitude,
          lng: request.longitude,
          surgeMultiplier, // optional: send to provider
        });
      } catch (err) {
        if (err instanceof Error) {
          console.error(`Failed to notify provider ${p.id}:`, err.message);
        }
      }
    }

    // --------------------------------------------------
    // 6️⃣ Return clean response
    // --------------------------------------------------

    return {
      request,
      surgeMultiplier,
      matchedProvidersCount: matchedProviders.length,
    };
  }

  async getAvailableProviders() {
    try {
      const providers = await this.redis.hgetall('providers:all');
      return Object.entries(providers).map(([id, value]) => ({
        id,
        ...JSON.parse(value),
      }));
    } catch (err) {
      console.error('Redis error:', err.message);
      return [];
    }
  }

  async getUserRequests(userId: string) {
    return this.prisma.serviceRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        description: true,
        paymentMode: true,
        totalAmount: true,
        createdAt: true,
        category: {
          select: { id: true, name: true },
        },
        provider: {
          select: {
            id: true,
            name: true,
            phone: true,
            rating: true,
            tier: true,
          },
        },
      },
    });
  }

  async acceptRequest(requestId: string, providerId: string) {
    // --------------------------------------------------
    // 1️⃣ Check active job cap FIRST (no Redis lock yet)
    // --------------------------------------------------

    const activeJobs = await this.prisma.serviceRequest.count({
      where: {
        providerId,
        status: {
          in: ['ASSIGNED', 'IN_PROGRESS'],
        },
      },
    });

    if (activeJobs >= 3) {
      throw new BadRequestException('Active job limit reached');
    }

    // --------------------------------------------------
    // Service Radius Validation
    // --------------------------------------------------

    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: providerId },
      select: {
        latitude: true,
        longitude: true,
        serviceRadiusKm: true,
        isOnline: true,
      },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    if (!provider.isOnline) {
      throw new BadRequestException('Provider must be online to accept jobs');
    }

    if (provider.latitude == null || provider.longitude == null) {
      throw new BadRequestException('Provider location not set. Please ensure location tracking is enabled.');
    }

    const request = await this.prisma.serviceRequest.findUnique({
      where: { id: requestId },
      select: {
        latitude: true,
        longitude: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    const distance = getDistanceInKm(
      provider.latitude,
      provider.longitude,
      request.latitude,
      request.longitude,
    );

    const radius = provider.serviceRadiusKm ?? 5;

    if (distance > radius) {
      throw new BadRequestException(`Request is outside your service radius (${radius} km)`);
    }

    // --------------------------------------------------
    // 2️⃣ Hourly accept rate limit (BEFORE acquiring lock)
    // --------------------------------------------------

    const rateKey = `provider:accept:${providerId}`;
    const currentCount = await this.redis.get(rateKey);
    if (currentCount && parseInt(currentCount) >= 20) {
      throw new BadRequestException('Accept limit exceeded for this hour');
    }

    // --------------------------------------------------
    // 3️⃣ Cooldown check
    // --------------------------------------------------

    const cooldownKey = `provider:cooldown:${providerId}`;
    const cooldownExists = await this.redis.get(cooldownKey);

    if (cooldownExists) {
      throw new BadRequestException(
        'Cooldown active. Please wait before accepting another job.',
      );
    }

    // --------------------------------------------------
    // 3️⃣ Acquire request lock (atomic race prevention)
    // --------------------------------------------------

    const lockKey = `lock:request:${requestId}`;
    const lockAcquired = await this.redis.setnx(lockKey, providerId);

    if (lockAcquired === 0) {
      throw new ConflictException('Request already accepted by another provider');
    }

    await this.redis.expire(lockKey, 30);

    try {
      // --------------------------------------------------
      // 4️⃣ Assign request in DB
      // --------------------------------------------------

      const updated = await this.prisma.serviceRequest.updateMany({
        where: { id: requestId, status: 'OPEN' },
        data: {
          status: 'ASSIGNED',
          providerId,
          assignedAt: new Date(),
        },
      });
      const request = await this.prisma.serviceRequest.findUnique({
        where: { id: requestId },
        include: {
          provider: true,
        },
      });

      if (!request) {
        throw new NotFoundException('Request not found after assignment');
      }

      this.realtimeService.emitProviderAssigned(request.userId, {
        id: requestId,
        status: 'ASSIGNED',
        providerId,
        provider: {
          name: request.provider?.name,
          phone: request.provider?.phone,
          rating: request.provider?.rating,
        },
      });

      await this.redis.set(
        `provider:lastJob:${providerId}`,
        Date.now().toString(),
        'EX',
        300,
      );

      if (updated.count === 0) {
        throw new ConflictException('Request already accepted by another provider');
      }

      // --------------------------------------------------
      // 5️⃣ Increment hourly counter now that accept succeeded
      // --------------------------------------------------

      const count = await this.redis.incr(rateKey);
      if (count === 1) await this.redis.expire(rateKey, 3600);

      // --------------------------------------------------
      // 6️⃣ Apply cooldown AFTER success
      // --------------------------------------------------

      await this.redis.set(cooldownKey, '1', 'EX', 10);

      // --------------------------------------------------
      // 7️⃣ Refresh presence
      // --------------------------------------------------

      await this.providersService.refreshPresence(providerId);

      return { success: true };
    } catch (err) {
      // Always release lock if something fails
      await this.redis.del(lockKey);
      throw err;
    }
  }

  async startJob(requestId: string, providerId: string) {
  const request = await this.prisma.serviceRequest.findFirst({
    where: {
      id: requestId,
      providerId,
      status: 'ASSIGNED',
    },
  });

  if (!request) {
    throw new NotFoundException('Cannot start job — request not found');
  }

  if (request.startedAt) {
    throw new BadRequestException('Job already started');
  }

  await this.prisma.serviceRequest.update({
    where: { id: requestId },
    data: {
      status: 'IN_PROGRESS',
      startedAt: new Date(),
    },
  });

  this.realtimeService.emitJobStarted(request.userId, {
    id: requestId,
    status: 'IN_PROGRESS',
  });

  return { success: true };
}

  async getTopProviders(
    categoryId: string,
    lat: number,
    lng: number,
    limit = 5,
  ) {
    const redisKey = `providers:${categoryId}`;

    let providers: Record<string, string>;

    try {
      providers = await this.redis.hgetall(redisKey);
    } catch (err) {
      console.error(
        'Redis unavailable:',
        err instanceof Error ? err.message : err,
      );
      return [];
    }

    const providerIds = Object.keys(providers);

    if (providerIds.length === 0) return [];

    // Fetch provider data from DB for scoring
    const dbProviders = await this.prisma.serviceProvider.findMany({
      where: {
        id: { in: providerIds },
        isOnline: true,
        isVerified: true,
      },
      select: {
        id: true,
        rating: true,
        totalJobs: true,
        completedJobs: true,
        performanceScore: true,
        source: true,
        riskProfile: true,
      },
    });

    const ranked: {
      id: string;
      distance: number;
      finalScore: number;
      source: string;
    }[] = [];

    for (const id of providerIds) {
      const redisData = JSON.parse(providers[id]);
      const dbProvider = dbProviders.find((p) => p.id === id);

      if (!dbProvider) continue;

      // Skip providers whose location hasn't been set yet
      if (redisData.lat == null || redisData.lng == null) continue;

      const distance = getDistanceInKm(lat, lng, redisData.lat, redisData.lng);

      // Skip providers outside 30 km radius
      if (distance > 30) continue;

      // ---------- SCORING ----------

      // 1️⃣ Distance (closer = higher score)
      const distanceScore = 100 - Math.min(distance * 10, 100);

      // 2️⃣ Rating (0–5 scaled to 0–100)
      const ratingScore = (dbProvider.rating / 5) * 100;

      // 3️⃣ Completion rate
      const completionRate =
        dbProvider.totalJobs > 0
          ? dbProvider.completedJobs / dbProvider.totalJobs
          : 0.5;

      const completionScore = completionRate * 100;

      // 4️⃣ Risk penalty
      const riskPenalty = dbProvider.riskProfile?.riskScore ?? 0;

      // 5️⃣ Recency boost (active in last 5 minutes)
      const recencyBoost =
        Date.now() - redisData.lastActive < 5 * 60 * 1000 ? 10 : 0;

      const performanceScore = dbProvider.performanceScore ?? 50;

      const lastJobKey = `provider:lastJob:${dbProvider.id}`;
      const lastJobTimestamp = await this.redis.get(lastJobKey);

      let recentJobPenalty = 0;

      if (lastJobTimestamp) {
        const elapsed = Date.now() - Number(lastJobTimestamp);

        if (elapsed < 120000) {
          recentJobPenalty = 20;
        } else if (elapsed < 300000) {
          recentJobPenalty = 10;
        }
      }

      const companyBoost = dbProvider.source === 'COMPANY' ? 20 : 0;

      const finalScore =
        distanceScore * 0.35 +
        ratingScore * 0.2 +
        completionScore * 0.15 +
        performanceScore * 0.2 -
        riskPenalty * 0.1 +
        recencyBoost +
        companyBoost -
        recentJobPenalty;

      ranked.push({
        id,
        distance,
        finalScore,
        source: dbProvider.source as string,
      });
    }

    return ranked.sort((a, b) => b.finalScore - a.finalScore).slice(0, limit);
  }

  async getRequestDetails(requestId: string, userId: string) {
    const req = await this.prisma.serviceRequest.findFirst({
      where: {
        id: requestId,
        userId,
      },
      select: {
        id: true,
        status: true,
        description: true,
        latitude: true,
        longitude: true,
        paymentMode: true,
        totalAmount: true,
        providerAmount: true,
        platformFee: true,
        createdAt: true,
        assignedAt: true,
        startedAt: true,
        completedAt: true,
        category: {
          select: { id: true, name: true },
        },
        provider: {
          select: {
            id: true,
            name: true,
            phone: true,
            rating: true,
            tier: true,
          },
        },
        images: {
          select: { id: true, imageUrl: true },
        },
        payment: {
          select: {
            id: true,
            mode: true,
            status: true,
            amount: true,
            platformFee: true,
            providerAmount: true,
          },
        },
        review: {
          select: { id: true, rating: true, comment: true },
        },
      },
    });

    if (!req) return null;

    // Map imageUrl → url to match frontend type
    return {
      ...req,
      images: req.images.map((img) => ({ id: img.id, url: img.imageUrl })),
    };
  }

  async getRequestDetailsForProvider(requestId: string, providerId: string) {
    const req = await this.prisma.serviceRequest.findFirst({
      where: {
        id: requestId,
        OR: [
          { providerId },       // assigned to this provider
          { status: 'OPEN' },   // open — provider received socket notification and is viewing
        ],
      },
      select: {
        id: true,
        status: true,
        providerId: true,
        description: true,
        latitude: true,
        longitude: true,
        paymentMode: true,
        totalAmount: true,
        providerAmount: true,
        platformFee: true,
        createdAt: true,
        assignedAt: true,
        startedAt: true,
        completedAt: true,
        category: { select: { id: true, name: true } },
        user: { select: { name: true, phone: true } },
        images: { select: { id: true, imageUrl: true } },
      },
    });

    if (!req) return null;

    // Only expose customer phone once the request is assigned to this provider.
    // For OPEN requests (pre-accept), hide PII to limit exposure.
    const isAssigned = req.providerId === providerId;

    return {
      ...req,
      images: req.images.map((img) => ({ id: img.id, url: img.imageUrl })),
      user: {
        name: req.user.name,
        phone: isAssigned ? req.user.phone : null,
      },
    };
  }

  async completeJob(
  requestId: string,
  providerId: string,
  finalAmount?: number,
) {
  const request = await this.prisma.serviceRequest.findFirst({
    where: {
      id: requestId,
      providerId,
      status: 'IN_PROGRESS',
    },
  });

  if (!request) {
    throw new NotFoundException('Job not found');
  }

  if (request.status === 'COMPLETED') {
    throw new BadRequestException('Job already completed');
  }

  // Use provider-quoted amount, or fall back to the pre-set totalAmount.
  // Clamp to a sane range: ₹0 – ₹1,00,000 to prevent manipulation.
  const raw = finalAmount ?? request.totalAmount ?? 0;
  const amount = Math.max(0, Math.min(raw, 100000));

  const result = await this.paymentEngine.prepareForConfirmation(
    requestId,
    amount,
  );

  await this.riskEngine.evaluate(providerId);

  const updatedRequest = await this.prisma.serviceRequest.findUnique({
  where: { id: requestId },
});

if (!updatedRequest) {
  throw new NotFoundException('Request not found after completion');
}

this.realtimeService.emitJobCompleted(updatedRequest.userId, {
  id: requestId,
  status: 'COMPLETED',
});

  return result;
}

  async confirmJob(requestId: string, userId: string, paymentMode?: PaymentMode) {
    // Allow customer to override payment mode at confirmation time
    if (paymentMode) {
      await this.prisma.serviceRequest.updateMany({
        where: { id: requestId, userId, status: 'AWAITING_CONFIRMATION' },
        data: { paymentMode },
      });
    }
    return this.paymentEngine.confirmAndRelease(requestId, userId);
  }
}
