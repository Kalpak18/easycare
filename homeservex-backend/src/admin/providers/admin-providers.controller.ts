import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '@prisma/client';
import { AdminProvidersService } from './admin-providers.service';

@Roles(Role.ADMIN)
@Controller('admin/providers')
export class AdminProvidersController {
  constructor(private service: AdminProvidersService) {}

  @Get()
  list() {
    return this.service.listProviders();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.service.getProvider(id);
  }

  @Patch(':id/verify')
  verify(@Param('id') id: string) {
    return this.service.verifyProvider(id);
  }

  @Patch(':id/block')
  block(@Param('id') id: string) {
    return this.service.blockProvider(id);
  }

  @Patch(':id/unblock')
  unblock(@Param('id') id: string) {
    return this.service.unblockProvider(id);
  }

  @Post('company-worker')
  createCompanyWorker(
    @Body()
    body: {
      name: string;
      phone: string;
      categoryId: string;
      city?: string;
      state?: string;
    },
  ) {
    return this.service.createCompanyWorker(body);
  }
}
