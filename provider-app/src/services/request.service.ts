import { api } from "./api";

export const getRequestDetails = (requestId: string) => {
  return api.get(`/requests/${requestId}`);
};

export const acceptRequest = (requestId: string) => {
  return api.post(`/requests/${requestId}/accept`);
};

export const rejectRequest = (requestId: string) => {
  return api.post(`/requests/${requestId}/reject`);
};

export const startJob = (requestId: string) => {
  return api.patch(`/requests/${requestId}/start`);
};

export const completeJob = (requestId: string, finalAmount?: number) => {
  return api.post(`/requests/${requestId}/complete`, finalAmount ? { finalAmount } : {});
};