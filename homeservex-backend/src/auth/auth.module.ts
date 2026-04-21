import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { jwtConstants } from './constants';
import { JwtStrategy } from './jwt.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { ProviderAuthController } from './provider-auth.controller';
import { ProviderAuthService } from './provider-auth.service';
import { UserAuthController } from './user-auth.controller';
import { UserAuthService } from './user-auth.service';
import { SmsService } from '../common/sms/sms.service';
import { EmailService } from '../common/email/email.service';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '15m' },
    }),
    PrismaModule,
  ],
  controllers: [AuthController, ProviderAuthController, UserAuthController],
  providers: [AuthService, JwtStrategy, ProviderAuthService, UserAuthService, SmsService, EmailService],
  exports: [AuthService],
})
export class AuthModule {}
