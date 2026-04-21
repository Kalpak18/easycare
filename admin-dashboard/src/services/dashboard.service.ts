import { api } from "./api";

export const dashboardService = {
  getStats: async () => {
    const res = await api.get("/admin/dashboard/stats");
    return res.data;
  },

  getRevenue: async () => {
    const res = await api.get("/admin/dashboard/revenue");
    return res.data;
  },

  getRecentRequests: async () => {
    const res = await api.get("/admin/dashboard/recent-requests");
    return res.data;
  },
};