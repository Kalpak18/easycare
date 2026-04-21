/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Controller, Post, Get, Body, Req } from '@nestjs/common';
import { Roles } from '../../auth/roles.decorator';
import { Role } from '@prisma/client';
import { ProviderKycService } from './provider-kyc.service';
import { UploadKycDto } from '../dto/upload-kyc.dto';

@Roles(Role.PROVIDER)
@Controller('providers/kyc')
export class ProviderKycController {
  constructor(private kycService: ProviderKycService) {}

  @Post('upload')
  upload(@Req() req, @Body() dto: UploadKycDto) {
    return this.kycService.uploadDocument(
      req.user.userId,
      dto.type,
      dto.fileUrl,
    );
  }

  @Get('documents')
  documents(@Req() req) {
    return this.kycService.getDocuments(req.user.userId);
  }

  @Get('status')
  status(@Req() req) {
    return this.kycService.getKycStatus(req.user.userId);
  }
}
