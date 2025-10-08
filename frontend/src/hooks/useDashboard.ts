import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchDashboard, fetchPlan, runAnalysis } from '../api/index.ts';
import { AnalysisPayload, DashboardResponse, PlanResponse } from '../types/api.ts';

export const useDashboard = (token: string | null) => {
  const queryClient = useQueryClient();
  const lastTokenRef = useRef<string | null>(null);
  const authKey = token ?? 'guest';

  const dashboardQuery = useQuery<DashboardResponse>({
    queryKey: ['dashboard', authKey],
    queryFn: () => fetchDashboard(token ?? ''),
    enabled: Boolean(token)
  });

  const planQuery = useQuery<PlanResponse>({
    queryKey: ['plan', authKey],
    queryFn: () => fetchPlan(token ?? ''),
    enabled: Boolean(token)
  });

  const analysisMutation = useMutation<DashboardResponse, Error, AnalysisPayload>({
    mutationFn: (payload) => runAnalysis(token ?? '', payload),
    onSuccess: (result) => {
      queryClient.setQueryData(['dashboard', authKey], result);
    }
  });

  useEffect(() => {
    if (lastTokenRef.current && lastTokenRef.current !== token) {
      const previousKey = lastTokenRef.current;
      queryClient.removeQueries({ queryKey: ['dashboard', previousKey], exact: true });
      queryClient.removeQueries({ queryKey: ['plan', previousKey], exact: true });
    }

    if (!token) {
      queryClient.removeQueries({ queryKey: ['dashboard'], exact: false });
      queryClient.removeQueries({ queryKey: ['plan'], exact: false });
    }

    lastTokenRef.current = token;
  }, [token, queryClient]);

  return {
    dashboardQuery,
    planQuery,
    analysisMutation
  };
};
