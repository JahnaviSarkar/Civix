import { useQuery } from "@tanstack/react-query";
import { fetchDashboardStats } from "../api/complaints";
import type { DashboardStats } from "../types";

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboardStats"],
    queryFn: fetchDashboardStats,
    refetchInterval: 30000
  });
}
