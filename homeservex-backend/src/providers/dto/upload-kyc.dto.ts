import { IsEnum, IsString, IsUrl } from 'class-validator';
import { ProviderDocumentType } from '@prisma/client';

export class UploadKycDto {
  @IsEnum(ProviderDocumentType)
  type: ProviderDocumentType;

  @IsString()
  @IsUrl()
  fileUrl: string;
}
