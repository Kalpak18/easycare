import { Controller, Get, Post, Body, BadRequestException } from '@nestjs/common';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '@prisma/client';
import { AdminFinanceService } from './admin-finance.service';

@Roles(Role.ADMIN)
@Controller('admin/finance')
export class AdminFinanceController {
  constructor(private service: AdminFinanceService) {}

  @Get('wallets')
  wallets() {
    return this.service.listWallets();
  }

  @Post('commission')
  setCommission(@Body() body: { categoryId: string; percentage: number }) {
    const pct = Number(body.percentage);
    if (!body.categoryId || isNaN(pct) || pct < 0 || pct > 100) {
      throw new BadRequestException('percentage must be a number between 0 and 100');
    }
    return this.service.upsertCommission(body.categoryId, Math.round(pct * 100) / 100);
  }
}
