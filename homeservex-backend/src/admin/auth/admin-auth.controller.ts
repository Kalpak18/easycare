import { Controller, Post, Body } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { Public } from '../../auth/public.decorator';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private authService: AdminAuthService) {}

  @Public()
  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }
}
