import { api } from "./api";

export interface CreateCategoryPayload {
  name: string;
}

export const categoriesService = {
  getCategories: async () => {
    const res = await api.get("/admin/categories");
    return res.data;
  },

  createCategory: async (data: CreateCategoryPayload) => {
    const res = await api.post("/admin/categories", data);
    return res.data;
  },

  deactivateCategory: async (id: string) => {
    const res = await api.patch(`/admin/categories/${id}/deactivate`);
    return res.data;
  },
};