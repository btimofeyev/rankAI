import axios from 'axios';
import {
  AnalysisPayload,
  CheckoutSessionResponse,
  DashboardResponse,
  PlanResponse,
  Project,
  ProjectsListResponse,
  ProjectResponse,
  CreateProjectPayload,
  UpdateProjectPayload,
  RunAnalysisResponse,
  QueryPerformance
} from '../types/api.ts';

const baseURL = import.meta.env.VITE_API_BASE ?? '/api';
const client = axios.create({ baseURL });

client.interceptors.response.use((response) => response, (error) => {
  const message = error?.response?.data?.error ?? error.message ?? 'Request failed';
  return Promise.reject(new Error(message));
});

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`
});

export const fetchPlan = async (token: string): Promise<PlanResponse> => {
  const { data } = await client.get<PlanResponse>('/billing/plan', { headers: authHeaders(token) });
  return data;
};

export const fetchDashboard = async (token: string): Promise<DashboardResponse> => {
  const { data } = await client.get<DashboardResponse>('/dashboard', { headers: authHeaders(token) });
  return data;
};

export const runAnalysis = async (token: string, payload: AnalysisPayload): Promise<DashboardResponse> => {
  const { data } = await client.post<DashboardResponse>('/analysis', payload, { headers: authHeaders(token) });
  return data;
};

export const createCheckout = async (token: string): Promise<CheckoutSessionResponse> => {
  const { data} = await client.post<CheckoutSessionResponse>('/billing/checkout', {}, { headers: authHeaders(token) });
  return data;
};

// Project API methods
export const fetchProjects = async (token: string): Promise<ProjectsListResponse> => {
  const { data } = await client.get<ProjectsListResponse>('/projects', { headers: authHeaders(token) });
  return data;
};

export const createProject = async (token: string, payload: CreateProjectPayload): Promise<{ project: Project }> => {
  const { data } = await client.post<{ project: Project }>('/projects', payload, { headers: authHeaders(token) });
  return data;
};

export const fetchProject = async (token: string, projectId: string): Promise<ProjectResponse> => {
  const { data } = await client.get<ProjectResponse>(`/projects/${projectId}`, { headers: authHeaders(token) });
  return data;
};

export const updateProject = async (token: string, projectId: string, payload: UpdateProjectPayload): Promise<{ project: Project }> => {
  const { data } = await client.patch<{ project: Project }>(`/projects/${projectId}`, payload, { headers: authHeaders(token) });
  return data;
};

export const deleteProject = async (token: string, projectId: string): Promise<void> => {
  await client.delete(`/projects/${projectId}`, { headers: authHeaders(token) });
};

export const runProjectAnalysis = async (token: string, projectId: string): Promise<RunAnalysisResponse> => {
  const { data } = await client.post<RunAnalysisResponse>(`/projects/${projectId}/analyze`, {}, { headers: authHeaders(token) });
  return data;
};

export const fetchQueryPerformance = async (token: string, projectId: string): Promise<{ performance: QueryPerformance[] }> => {
  const { data } = await client.get<{ performance: QueryPerformance[] }>(`/projects/${projectId}/query-performance`, { headers: authHeaders(token) });
  return data;
};

export const trackQuery = async (token: string, projectId: string, query: string): Promise<{ project: Project }> => {
  const { data } = await client.post<{ project: Project }>(`/projects/${projectId}/tracked-queries`, { query }, { headers: authHeaders(token) });
  return data;
};

export const untrackQuery = async (token: string, projectId: string, query: string): Promise<{ project: Project }> => {
  const { data } = await client.delete<{ project: Project }>(`/projects/${projectId}/tracked-queries`, {
    headers: authHeaders(token),
    data: { query }
  });
  return data;
};
