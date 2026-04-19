import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import api from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/server';

// Types
interface RecentActivity {
  type: 'opportunity' | 'work_order';
  date: string;
  clientName: string;
  label: string;
}

interface DashboardStats {
  totalRevenue: number;
  newOpportunities: number;
  totalOpportunities: number;
  activeWorkOrders: number;
  completedWorkOrders: number;
  pendingApprovals: number;
  recentActivities: RecentActivity[];
}

// Query Keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
};

// Dashboard Stats Hook
export function useDashboardStats(): UseQueryResult<DashboardStats, Error> {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async (): Promise<DashboardStats> => {
      const response = await api.get(API_ENDPOINTS.DASHBOARD.STATS);
      return response.data;
    },
    staleTime: 1000 * 60 * 1, // 1 minute
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
}
