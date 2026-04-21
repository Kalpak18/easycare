import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/dashboard.service";

export const useDashboardStats = () =>
  useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: dashboardService.getStats,
  });

export const useRevenueStats = () =>
  useQuery({
    queryKey: ["dashboard-revenue"],
    queryFn: dashboardService.getRevenue,
  });

export const useRecentRequests = () =>
  useQuery({
    queryKey: ["dashboard-requests"],
    queryFn: dashboardService.getRecentRequests,
  });