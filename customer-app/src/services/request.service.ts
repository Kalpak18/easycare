import api from './api';
import { ServiceRequest, PaymentMode } from '../types';

export interface CreateRequestPayload {
  categoryId: string;
  description: string;
  latitude: number;
  longitude: number;
  imageUrls?: string[];
  paymentMode: PaymentMode;
  preferredSource?: 'MARKETPLACE' | 'COMPANY';
  scheduledAt?: string;          // ISO datetime string
  serviceMetadata?: Record<string, string>;
}

export const createRequest = async (payload: CreateRequestPayload): Promise<ServiceRequest> => {
  const res = await api.post('/requests', payload);
  return res.data;
};

export const getMyRequests = async (): Promise<ServiceRequest[]> => {
  const res = await api.get('/requests/my');
  return res.data;
};

export const getRequestById = async (id: string): Promise<ServiceRequest> => {
  const res = await api.get(`/requests/${id}`);
  return res.data;
};

export const confirmCompletion = async (
  id: string,
  paymentMode: PaymentMode,
): Promise<ServiceRequest> => {
  const res = await api.post(`/requests/${id}/confirm`, { paymentMode });
  return res.data;
};

export const leaveReview = async (
  requestId: string,
  rating: number,
  comment?: string,
): Promise<void> => {
  await api.post(`/reviews/${requestId}`, { rating, comment });
};

export const uploadRequestImage = async (fileUri: string): Promise<string> => {
  // Convert local URI to base64 for Cloudinary upload
  const response = await fetch(fileUri);
  const blob = await response.blob();
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const res = await api.post('/requests/upload-image', { image: base64 });
  return res.data.url as string;
};
