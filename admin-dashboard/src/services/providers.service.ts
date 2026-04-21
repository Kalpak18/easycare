    import { api } from "./api";

export const providersService = {
  getProviders: async () => {
    const res = await api.get("/admin/providers");
    return res.data;
  },

  getProvider: async (id: string) => {
    const res = await api.get(`/admin/providers/${id}`)
    return res.data
  },

  verifyProvider: async (id: string) => {
    const res = await api.patch(`/admin/providers/${id}/verify`);
    return res.data;
  },

  blockProvider: async (id: string) => {
    const res = await api.patch(`/admin/providers/${id}/block`);
    return res.data;
  },

  unblockProvider: async (id: string) => {
    const res = await api.patch(`/admin/providers/${id}/unblock`);
    return res.data;
  },
};