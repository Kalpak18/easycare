export interface Request {
  id: string
  userName: string
  service: string
  status: "pending" | "assigned" | "started" | "completed" | "cancelled"
  providerName?: string
  createdAt: string
}