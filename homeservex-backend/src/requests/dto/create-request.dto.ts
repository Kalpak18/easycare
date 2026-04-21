import { IsString, IsNumber, IsIn, IsOptional, IsArray, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRequestDto {
  @IsString()
  categoryId: string;

  @IsString()
  description: string;

  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  longitude: number;

  @IsIn(['UPI', 'CASH'])
  paymentMode: 'UPI' | 'CASH';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsIn(['MARKETPLACE', 'COMPANY'])
  preferredSource?: 'MARKETPLACE' | 'COMPANY';

  @IsOptional()
  @IsString()
  scheduledAt?: string;

  @IsOptional()
  @IsObject()
  serviceMetadata?: Record<string, string>;
}
