import { api } from "./api"

export const requestsService = {
  getRequests: async (page = 1, limit = 20) => {
    const res = await api.get(`/admin/dashboard/requests?page=${page}&limit=${limit}`)
    return res.data
  },

  getRequest: async (id: string) => {
    const res = await api.get(`/admin/dashboard/requests?page=1&limit=1000`)
    const all = res.data?.requests ?? res.data ?? []
    return all.find((r: { id: string }) => r.id === id) ?? null
  },
}
