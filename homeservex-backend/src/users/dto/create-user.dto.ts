/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsString, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  email?: string;
}
