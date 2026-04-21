import { api } from "./api";

export interface CommissionPayload {
  categoryId: string;
  percentage: number;
}

export const financeService = {
  setCommission: async (data: CommissionPayload) => {
    const res = await api.post("/admin/finance/commission", data);
    return res.data;
  },
};