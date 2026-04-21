import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProviderKycController } from './provider-kyc.controller';
import { ProviderKycService } from './provider-kyc.service';
import { ProvidersController } from '../providers.controller';
import { ProvidersService } from '../providers.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    ProvidersController,
    ProviderKycController, // ✅ ADD
  ],
  providers: [
    ProvidersService,
    ProviderKycService, // ✅ ADD
  ],
})
export class ProvidersModule {}
