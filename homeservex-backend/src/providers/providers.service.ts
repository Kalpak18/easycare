import {
  Injectable,
  Inject,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { Role, ProviderDocumentType, DocumentStatus, OnboardingStep } from '@prisma/client';
import { KycPolicyService } from './kyc-policy.service';
import { getDistanceInKm } from '../common/utils/distance';

@Injectable()
export class ProvidersService {
  constructor(
    private prisma: PrismaService,
    @Inject('REDIS_CLIENT') private redis: Redis,
    private kycPolicyService: KycPolicyService,
  ) {}

  // ---------------- BASIC ----------------

  async findByPhone(phone: string) {
    return this.prisma.serviceProvider.findUnique({
      where: { phone },
    });
  }

  async createProvider(data: {
    name: string;
    phone: string;
    categoryId: string;
    email?: string;
    latitude?: number;
    longitude?: number;
    source?: 'MARKETPLACE' | 'COMPANY';
  }) {
    return this.prisma.serviceProvider.create({
      data: {
        ...data,
        role: Role.PROVIDER,
        source: data.source ?? 'MARKETPLACE',
        isVerified: data.source === 'COMPANY',
        isOnline: false,
        wallet: {
          create: {
            balance: 0,
            blocked: false,
          },
        },
      },
    });
  }

  // ---------------- ONLINE / OFFLINE ----------------

  async setOnline(providerId: string, status: boolean) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: providerId },
      include: { wallet: true },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    // OFFLINE always allowed
    if (!status) {
      const updated = await this.prisma.serviceProvider.update({
        where: { id: providerId },
        data: { isOnline: false },
      });

      const redisKey = `providers:${provider.categoryId}`;
      await this.redis.hdel(redisKey, provider.id);

      return updated;
    }

    // ONLINE validations
    if (!provider.isVerified) {
      throw new ForbiddenException({
        code: 'PROVIDER_NOT_VERIFIED',
        message: 'Provider not verified by admin',
      });
    }

    if (!provider.wallet) {
      throw new ForbiddenException('Wallet not initialized');
    }

    const MAX_NEGATIVE_BALANCE = -500;

    if (
      provider.wallet.blocked ||
      provider.wallet.balance < MAX_NEGATIVE_BALANCE
    ) {
      throw new ForbiddenException(
        'Wallet blocked or dues exceeded. Clear dues to go online',
      );
    }

    const updated = await this.prisma.serviceProvider.update({
      where: { id: providerId },
      data: { isOnline: true },
    });

    const redisKey = `providers:${provider.categoryId}`;

    // Only add to the matching pool if we have a real location.
    // If location is null, the provider app will call POST /providers/location
    // immediately after going online, which triggers updateLocation() and adds them.
    if (provider.latitude != null && provider.longitude != null) {
      await this.redis.hset(
        redisKey,
        provider.id,
        JSON.stringify({
          lat: provider.latitude,
          lng: provider.longitude,
          rating: provider.rating,
          lastActive: Date.now(),
        }),
      );
    }

    await this.redis.set(
      `provider:heartbeat:${provider.id}`,
      '1',
      'EX',
      30,
    );

    return updated;
  }

  // ---------------- KYC DOCUMENTS ----------------

  async upsertKycDocument(
    providerId: string,
    type: ProviderDocumentType,
    fileUrl: string,
  ) {
    return this.prisma.providerDocument.upsert({
      where: {
        providerId_type: {
          providerId,
          type,
        },
      },
      update: {
        fileUrl,
        status: DocumentStatus.PENDING,
        rejectionReason: null,
      },
      create: {
        providerId,
        type,
        fileUrl,
        status: DocumentStatus.PENDING,
      },
    });
  }

  async getProviderDocuments(providerId: string) {
    return this.prisma.providerDocument.findMany({
      where: { providerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getKycStatus(providerId: string) {
    const docs = await this.prisma.providerDocument.findMany({
      where: { providerId },
      select: { status: true },
    });

    if (docs.length === 0) return 'NOT_STARTED';

    if (docs.some((d) => d.status === DocumentStatus.REJECTED))
      return 'REJECTED';

    if (docs.some((d) => d.status === DocumentStatus.PENDING)) return 'PENDING';

    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: providerId },
      select: { isVerified: true },
    });

    return provider?.isVerified ? 'APPROVED' : 'PENDING';
  }

  async isKycComplete(providerId: string): Promise<boolean> {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: providerId },
      include: {
        documents: true,
        category: true,
      },
    });

    if (!provider || !provider.category) return false;

    const requiredDocs = this.kycPolicyService.getRequiredDocuments(
      provider.category.name,
    );

    const uploadedTypes = provider.documents.map((d) => d.type);

    const missing = requiredDocs.filter(
      (type) => !uploadedTypes.includes(type),
    );

    if (missing.length > 0) return false;

    const allApproved = provider.documents.every(
      (d) => d.status === 'APPROVED',
    );

    return allApproved;
  }

  async submitKyc(providerId: string) {
  const provider = await this.prisma.serviceProvider.findUnique({
    where: { id: providerId },
    include: {
      documents: true,
      category: true,
    },
  });

  if (!provider) {
    throw new NotFoundException("Provider not found");
  }

  if (!provider.category) {
    throw new ForbiddenException(
      "Provider category missing. Complete profile first."
    );
  }

  if (!provider.documents) {
    throw new ForbiddenException("No documents uploaded");
  }

  const requiredDocs =
    this.kycPolicyService.getRequiredDocuments(
      provider.category.name,
    ) || [];

  const uploadedTypes = provider.documents.map(
    (d) => d.type,
  );

  const missingDocs = requiredDocs.filter(
    (type) => !uploadedTypes.includes(type),
  );

  if (missingDocs.length > 0) {
    throw new ForbiddenException({
      message: "Missing required documents",
      missing: missingDocs,
    });
  }

  return {
    success: true,
    status: "UNDER_REVIEW",
  };
}

  async evaluateKyc(providerId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: providerId },
      include: { documents: true },
    });

    if (!provider) {
      throw new NotFoundException('Provider not found');
    }

    if (!provider.documents || provider.documents.length === 0) {
      return;
    }

    const allApproved = provider.documents.every(
      (d) => d.status === DocumentStatus.APPROVED,
    );

    if (allApproved) {
      await this.prisma.serviceProvider.update({
        where: { id: providerId },
        data: {
          isVerified: true,
          onboardingStep: OnboardingStep.KYC_APPROVED,
        },
      });
    }
  }

  // ---------------- PROFILE & DASHBOARD ----------------

  async getProfile(providerId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: providerId },
      select: {
        id: true,
        name: true,
        phone: true,
        isVerified: true,
        isOnline: true,
        rating: true,
        totalJobs: true,
        completedJobs: true,
        category: {
          select: { id: true, name: true },
        },
        wallet: {
          select: {
            balance: true,
            blocked: true,
          },
        },
        documents: {
          select: { status: true },
        },
      },
    });

    if (!provider) return null;

    const { documents, ...rest } = provider;

    let kycStatus: string;
    if (provider.isVerified) {
      kycStatus = 'APPROVED';
    } else if (!documents.length) {
      kycStatus = 'NOT_STARTED';
    } else if (documents.some((d) => d.status === DocumentStatus.REJECTED)) {
      kycStatus = 'REJECTED';
    } else {
      kycStatus = 'PENDING';
    }

    return { ...rest, kycStatus };
  }

  async getProviderJobs(providerId: string) {
    return this.prisma.serviceRequest.findMany({
      where: {
        providerId,
        status: {
          in: ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'],
        },
      },
      orderBy: {
        createdAt: 'desc',
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
        completedAt: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
        category: {
          select: { name: true },
        },
      },
    });
  }

  async refreshPresence(providerId: string) {
    const provider = await this.prisma.serviceProvider.findUnique({
      where: { id: providerId },
      select: {
        categoryId: true,
        latitude: true,
        longitude: true,
        rating: true,
      },
    });

    if (!provider) return;

    const redisKey = `providers:${provider.categoryId}`;

    await this.redis.hset(
      redisKey,
      providerId,
      JSON.stringify({
        lat: provider.latitude,
        lng: provider.longitude,
        rating: provider.rating,
        lastActive: Date.now(),
      }),
    );
  }
  async updateLocation(
    providerId: string,
    latitude: number,
    longitude: number,
  ) {
    const provider = await this.prisma.serviceProvider.update({
      where: { id: providerId },
      data: {
        latitude,
        longitude,
      },
      select: {
        id: true,
        categoryId: true,
        rating: true,
      },
    });

    const redisKey = `providers:${provider.categoryId}`;

    await this.redis.hset(
      redisKey,
      providerId,
      JSON.stringify({
        lat: latitude,
        lng: longitude,
        rating: provider.rating,
        lastActive: Date.now(),
      }),
    );
    await this.redis.set(
      `provider:heartbeat:${providerId}`,
      '1',
      'EX',
      30,
    );

    return { success: true };
  }

  // ---------------- NEARBY (for map) ----------------

  async getNearbyProviders(
    categoryId: string,
    lat: number,
    lng: number,
    radiusKm = 10,
    source?: 'MARKETPLACE' | 'COMPANY',
  ) {
    const dbProviders = await this.prisma.serviceProvider.findMany({
      where: {
        categoryId,
        isOnline: true,
        isVerified: true,
        latitude: { not: null },
        longitude: { not: null },
        ...(source ? { source } : {}),
      },
      select: {
        id: true,
        name: true,
        rating: true,
        tier: true,
        source: true,
        totalJobs: true,
        completedJobs: true,
        latitude: true,
        longitude: true,
      },
    });

    return dbProviders
      .map((p) => ({
        ...p,
        distanceKm: getDistanceInKm(lat, lng, p.latitude!, p.longitude!),
      }))
      .filter((p) => p.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }
}
