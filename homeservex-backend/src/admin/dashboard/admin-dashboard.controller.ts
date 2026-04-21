import { Controller, Get, Patch, Param, Body, Query, BadRequestException } from '@nestjs/common';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '@prisma/client';
import { AdminDashboardService } from './admin-dashboard.service';

const VALID_RESOLUTIONS = new Set(['RESOLVED_USER', 'RESOLVED_PROVIDER', 'REJECTED']);

@Roles(Role.ADMIN)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly service: AdminDashboardService) {}

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }

  @Get('revenue')
  getRevenue() {
    return this.service.getRevenue();
  }

  @Get('recent-requests')
  getRecentRequests() {
    return this.service.getRecentRequests();
  }

  @Get('disputes')
  getDisputes() {
    return this.service.listDisputes();
  }

  @Patch('disputes/:id/resolve')
  resolveDispute(
    @Param('id') id: string,
    @Body()
    body: {
      resolution: 'RESOLVED_USER' | 'RESOLVED_PROVIDER' | 'REJECTED';
      note: string;
    },
  ) {
    if (!VALID_RESOLUTIONS.has(body.resolution)) {
      throw new BadRequestException('Invalid resolution value');
    }
    return this.service.resolveDispute(id, body.resolution, body.note);
  }

  @Get('requests')
  getAllRequests(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getAllRequests(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }
}
