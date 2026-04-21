export interface KycDocument {
  id: string;
  type: string;
  url: string;
  status: "pending" | "approved" | "rejected";
}

export interface ProviderKyc {
  providerId: string;
  name: string;
  documents: KycDocument[];
}