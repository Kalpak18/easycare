import { Controller, Post, Body, Req, Patch, Param, Get } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { Roles } from '../auth/roles.decorator';
import { Role, PaymentMode } from '@prisma/client';
import type { AuthRequest } from '../auth/types/auth-request.type';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  // ---------------- CREATE ----------------

  @Post()
  @Roles(Role.USER)
  async create(@Req() req: AuthRequest, @Body() dto: CreateRequestDto) {
    return this.requestsService.createRequest(req.user.userId, dto);
  }

  // ---------------- UPLOAD IMAGE (customer) ----------------

  @Post('upload-image')
  @Roles(Role.USER)
  async uploadImage(@Body() body: { image: string }) {
    const url = await this.requestsService.uploadImage(body.image);
    return { url };
  }

  // ---------------- ACCEPT ----------------

  @Roles(Role.PROVIDER)
  @Post(':id/accept')
  async accept(@Req() req: AuthRequest, @Param('id') id: string) {
    return this.requestsService.acceptRequest(id, req.user.userId);
  }

  // ---------------- REJECT ----------------

  @Roles(Role.PROVIDER)
  @Post(':id/reject')
  reject() {
    // Provider declines — request stays OPEN for other providers
    return { success: true };
  }

  // ---------------- START ----------------

  @Patch(':id/start')
  @Roles(Role.PROVIDER)
  async startJob(@Param('id') requestId: string, @Req() req: AuthRequest) {
    return this.requestsService.startJob(requestId, req.user.userId);
  }

  // ---------------- COMPLETE ----------------

  @Post(':id/complete')
  @Roles(Role.PROVIDER)
  completeJob(
    @Param('id') id: string,
    @Body() body: { finalAmount?: number },
    @Req() req: AuthRequest,
  ) {
    return this.requestsService.completeJob(
      id,
      req.user.userId,
      body.finalAmount,
    );
  }

  @Post(':id/confirm')
  @Roles(Role.USER)
  confirmCompletion(
    @Param('id') id: string,
    @Body() body: { paymentMode?: PaymentMode },
    @Req() req: AuthRequest,
  ) {
    return this.requestsService.confirmJob(id, req.user.userId, body.paymentMode);
  }

  // ---------------- USER REQUESTS ----------------

  @Get('my')
  @Roles(Role.USER)
  getMyRequests(@Req() req: AuthRequest) {
    return this.requestsService.getUserRequests(req.user.userId);
  }

  @Get(':id')
  @Roles(Role.USER, Role.PROVIDER)
  getRequestDetails(@Param('id') requestId: string, @Req() req: AuthRequest) {
    if (req.user.role === Role.PROVIDER) {
      return this.requestsService.getRequestDetailsForProvider(requestId, req.user.userId);
    }
    return this.requestsService.getRequestDetails(requestId, req.user.userId);
  }
}
