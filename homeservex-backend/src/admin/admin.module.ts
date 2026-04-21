import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAuthModule } from './auth/admin-auth.module';
import { AdminProvidersService } from './providers/admin-providers.service';
import { AdminProvidersController } from './providers/admin-providers.controller';
import { AdminFinanceController } from './finance/admin-finance.controller';
import { AdminCategoriesController } from './categories/admin-categories.controller';
import { AdminCategoriesService } from './categories/admin-categories.service';
import { AdminFinanceService } from './finance/admin-finance.service';
import { AdminKycController } from './kyc/admin-kyc.controller';
import { AdminKycService } from './kyc/admin-kyc.service';
import { AdminDashboardController } from './dashboard/admin-dashboard.controller';
import { AdminDashboardService } from './dashboard/admin-dashboard.service';
import { ProvidersModule } from 'src/providers/providers.module';
import { PaymentsModule } from 'src/payments/payments.module';

@Module({
  imports: [PrismaModule, AdminAuthModule, ProvidersModule, PaymentsModule],
  controllers: [
    AdminProvidersController,
    AdminCategoriesController,
    AdminFinanceController,
    AdminKycController,
    AdminDashboardController,
  ],
  providers: [
    AdminService,
    AdminProvidersService,
    AdminFinanceService,
    AdminCategoriesService,
    AdminKycService,
    AdminDashboardService,
  ],
})
export class AdminModule {}
