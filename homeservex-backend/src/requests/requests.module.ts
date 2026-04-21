import { Module } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { RequestsController } from './requests.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { PaymentsModule } from '../payments/payments.module';
import { ProvidersModule } from 'src/providers/providers.module';
import { AutoExpireService } from './auto-expire.service';
import { AutoSlaService } from './auto-sla.service';

@Module({
  imports: [
    PrismaModule,
    RealtimeModule, // ✅ THIS IS THE FIX
    PaymentsModule,
    ProvidersModule,
  ],
  providers: [RequestsService, AutoExpireService, AutoSlaService],
  controllers: [RequestsController],
})
export class RequestsModule {}
