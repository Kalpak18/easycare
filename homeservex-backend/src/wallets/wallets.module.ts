import { Module } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [WalletsService],
  exports: [WalletsService],
})
export class WalletsModule {}
