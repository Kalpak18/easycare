import { Controller, Post, Body, Param, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import type { AuthRequest } from 'src/auth/types/auth-request.type';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Roles(Role.USER)
  @Post(':requestId')
  create(
    @Param('requestId') requestId: string,
    @Body() body: { rating: number; comment?: string },
    @Req() req: AuthRequest,
  ) {
    return this.reviewsService.createReview(
      requestId,
      req.user.userId,
      body.rating,
      body.comment,
    );
  }
}
