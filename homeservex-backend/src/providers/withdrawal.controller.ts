import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import type { AuthRequest } from '../auth/types/auth-request.type';
import { WithdrawalService } from './withdrawal.service';

@Controller('providers/withdrawals')
export class WithdrawalController {
  constructor(private readonly withdrawalService: WithdrawalService) {}

  @Roles(Role.PROVIDER)
  @Post()
  request(@Req() req: AuthRequest, @Body() body: { amount: number }) {
    return this.withdrawalService.requestWithdrawal(
      req.user.userId,
      body.amount,
    );
  }

  @Roles(Role.PROVIDER)
  @Get()
  history(@Req() req: AuthRequest) {
    return this.withdrawalService.getWithdrawals(req.user.userId);
  }
}
