import { api } from "./api";

export const kycService = {
  getPendingProviders: async () => {
    const res = await api.get("/admin/kyc/pending-providers");
    return res.data;
  },

  getProviderKyc: async (providerId: string) => {
    const res = await api.get(`/admin/kyc/provider/${providerId}`);
    return res.data;
  },

  approveDocument: async (documentId: string) => {
    const res = await api.patch(`/admin/kyc/approve/${documentId}`);
    return res.data;
  },

  rejectDocument: async (documentId: string, reason?: string) => {
    const res = await api.patch(`/admin/kyc/reject/${documentId}`, { reason });
    return res.data;
  },
};