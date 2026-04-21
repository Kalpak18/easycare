/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Controller, Post, Body, Get, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AuthService } from '../auth/auth.service';
import { Public } from '../auth/public.decorator';
import { Role } from '@prisma/client';
import { Roles } from 'src/auth/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private authService: AuthService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    const existing = await this.usersService.findByPhone(dto.phone);
    if (existing) {
      return this.authService.issueTokens({
        userId: existing.id,
        role: Role.USER,
      });
    }

    const user = await this.usersService.createUser(dto);
    return this.authService.issueTokens({
      userId: user.id,
      role: Role.USER,
    });
  }

  @Get('me')
  @Roles(Role.USER)
  getProfile(@Req() req) {
    return this.usersService.getProfile(req.user.userId);
  }
}
