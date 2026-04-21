export type DocumentType =
  | "PROFILE_PHOTO"
  | "AADHAAR_FRONT"
  | "AADHAAR_BACK"
  | "PAN_CARD"
  | "BANK_PROOF"
  | "SKILL_CERTIFICATE"
  | "POLICE_VERIFICATION"
  | "DRIVING_LICENSE"
  | "VEHICLE_RC"
  | "VEHICLE_INSURANCE";

export type DocumentStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export interface ProviderDocument {
  id: string;
  type: DocumentType;
  fileUrl: string;
  status: DocumentStatus;
  rejectionReason?: string | null;
  createdAt: string;
}