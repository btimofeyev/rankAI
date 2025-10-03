import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchDashboard, fetchPlan, runAnalysis } from '../api/index.ts';
import { AnalysisPayload, DashboardResponse, PlanResponse } from '../types/api.ts';

export const useDashboard = (token: string | null) => {
  const queryClient = useQueryClient();

  const dashboardQuery = useQuery<DashboardResponse>({
    queryKey: ['dashboard'],
    queryFn: () => fetchDashboard(token ?? ''),
    enabled: Boolean(token)
  });

  const planQuery = useQuery<PlanResponse>({
    queryKey: ['plan'],
    queryFn: () => fetchPlan(token ?? ''),
    enabled: Boolean(token)
  });

  const analysisMutation = useMutation<DashboardResponse, Error, AnalysisPayload>({
    mutationFn: (payload) => runAnalysis(token ?? '', payload),
    onSuccess: (result) => {
      queryClient.setQueryData(['dashboard'], result);
    }
  });

  return {
    dashboardQuery,
    planQuery,
    analysisMutation
  };
};
