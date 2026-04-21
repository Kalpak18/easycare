import { Injectable } from '@nestjs/common';
import { ProviderDocumentType } from '@prisma/client';

@Injectable()
export class KycPolicyService {
  /**
   * Core required documents for ALL providers in India
   */
  private baseRequiredDocs(): ProviderDocumentType[] {
    return [
      ProviderDocumentType.PROFILE_PHOTO,
      ProviderDocumentType.AADHAAR_FRONT,
      ProviderDocumentType.AADHAAR_BACK,
      ProviderDocumentType.PAN_CARD,
      ProviderDocumentType.BANK_PROOF,
    ];
  }

  /**
   * Category specific rules
   */
  private categoryRules(categoryName: string): ProviderDocumentType[] {
    switch (categoryName.toLowerCase()) {
      case 'driver':
        return [
          ProviderDocumentType.DRIVING_LICENSE,
          ProviderDocumentType.VEHICLE_RC,
          ProviderDocumentType.VEHICLE_INSURANCE,
        ];

      case 'beautician':
        return [ProviderDocumentType.SKILL_CERTIFICATE];

      case 'electrician':
      case 'plumber':
        return [
          // optional skill certificate
        ];

      default:
        return [];
    }
  }

  /**
   * Main public method
   */
  getRequiredDocuments(categoryName: string): ProviderDocumentType[] {
    const base = this.baseRequiredDocs();
    const category = this.categoryRules(categoryName);

    return [...new Set([...base, ...category])];
  }
}
