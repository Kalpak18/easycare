import { MiddlewareConsumer, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProvidersModule } from './providers/providers.module';
import { PaymentsModule } from './payments/payments.module';
import { AdminModule } from './admin/admin.module';
import { RedisModule } from './redis/redis.module';
import { RequestsModule } from './requests/requests.module';
import { RealtimeModule } from './realtime/realtime.module';
import { ScheduleModule } from '@nestjs/schedule/dist/schedule.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { TraceMiddleware } from './common/middleware/trace.middleware';
import { ReviewsModule } from './reviews/reviews.module';
import { CategoriesModule } from './categories/categories.module';
import { DisputesModule } from './disputes/disputes.module';
import { RequestWorker } from './workers/request.worker';
import { RequestTimeoutWorker } from './workers/request-timeout.worker';
import { ProviderHeartbeatWorker } from './workers/provider-heartbeat.worker';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    PrismaModule,
    ProvidersModule,
    PaymentsModule,
    AdminModule,
    RedisModule,
    RequestsModule,
    RealtimeModule,
    ReviewsModule,
    CategoriesModule,
    DisputesModule,
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 600, // 600 req/min per IP (10/sec) — enough for mobile apps
      },
    ]),
  ],
  providers: [
    RequestWorker,
    RequestTimeoutWorker,
    ProviderHeartbeatWorker,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TraceMiddleware).forRoutes('*');
  }
}
