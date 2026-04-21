/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Get, Req } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';

@Controller('wallet')
@Roles(Role.PROVIDER)
export class WalletsController {
  constructor(private walletsService: WalletsService) {}

  @Get('me')
  getMyWallet(@Req() req) {
    return this.walletsService.getWalletWithTransactions(req.user.userId);
  }
}
