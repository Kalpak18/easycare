import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '@prisma/client';
import { AdminKycService } from './admin-kyc.service';

@Roles(Role.ADMIN)
@Controller('admin/kyc')
export class AdminKycController {
  constructor(private service: AdminKycService) {}

  @Get('pending-providers')
  getPendingProviders() {
    return this.service.getPendingProviders();
  }

  @Get('provider/:providerId')
  getProviderDocs(@Param('providerId') providerId: string) {
    return this.service.getProviderDocuments(providerId);
  }

  @Patch('approve/:documentId')
  approve(@Param('documentId') id: string) {
    return this.service.approveDocument(id);
  }

  @Patch('reject/:documentId')
  reject(@Param('documentId') id: string, @Body() body: { reason: string }) {
    return this.service.rejectDocument(id, body.reason);
  }
}
