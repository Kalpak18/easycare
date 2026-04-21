export type RequestStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'AWAITING_CONFIRMATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED'
  | 'EXPIRED';

export type PaymentMode = 'UPI' | 'CASH';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED';

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
}

export interface ServiceProvider {
  id: string;
  name: string;
  phone: string;
  rating: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD';
}

export interface ServiceRequest {
  id: string;
  status: RequestStatus;
  description: string;
  latitude: number;
  longitude: number;
  totalAmount?: number;
  providerAmount?: number;
  platformFee?: number;
  createdAt: string;
  assignedAt?: string;
  startedAt?: string;
  completedAt?: string;
  category: ServiceCategory;
  provider?: ServiceProvider;
  images: RequestImage[];
  payment?: Payment;
  review?: Review;
}

export interface RequestImage {
  id: string;
  url: string;
}

export interface Payment {
  id: string;
  mode: PaymentMode;
  status: PaymentStatus;
  amount: number;
  platformFee: number;
  providerAmount: number;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  createdAt: string;
}
