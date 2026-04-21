import { api } from "./api";

export interface AdminLoginPayload {
  email: string;
  password: string;
}

export const adminAuthService = {
  login: async (data: AdminLoginPayload) => {
    const res = await api.post("/admin/auth/login", data);
    return res.data;
  },
};