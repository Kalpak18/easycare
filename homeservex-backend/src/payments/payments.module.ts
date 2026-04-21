import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletsModule } from '../wallets/wallets.module';
import { PaymentEngineService } from './payment-engine.service';
import { ProvidersModule } from 'src/providers/providers.module';

@Module({
  imports: [PrismaModule, WalletsModule, ProvidersModule],
  providers: [PaymentsService, PaymentEngineService],
  exports: [PaymentsService, PaymentEngineService],
})
export class PaymentsModule {}
