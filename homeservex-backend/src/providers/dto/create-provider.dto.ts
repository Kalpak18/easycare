import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateProviderDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsString()
  categoryId: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}
