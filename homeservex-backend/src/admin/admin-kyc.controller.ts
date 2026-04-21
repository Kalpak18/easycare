import { Body, Controller, Patch } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';

@Controller('admin/kyc')
@Roles(Role.ADMIN)
export class AdminKycController {
  constructor(private adminService: AdminService) {}

  @Patch('document/approve')
  approveDocument(@Body() body: { documentId: string }) {
    return this.adminService.approveDocument(body.documentId);
  }

  @Patch('document/reject')
  rejectDocument(@Body() body: { documentId: string; reason: string }) {
    return this.adminService.rejectDocument(body.documentId, body.reason);
  }
}
