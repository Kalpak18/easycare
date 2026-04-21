import { Controller, Post, Param, Body, Req } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { DisputesService } from './disputes.service';
import type { AuthRequest } from '../auth/types/auth-request.type';

@Roles(Role.USER)
@Controller('disputes')
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post(':requestId')
  raiseDispute(
    @Param('requestId') requestId: string,
    @Body('reason') reason: string,
    @Req() req: AuthRequest,
  ) {
    return this.disputesService.raiseDispute(requestId, req.user.userId, reason);
  }
}
