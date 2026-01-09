import api from './axios';
import { API_ROUTES } from '../constants/apiRoutes';

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  jobType: string;
  salary: string;
  description: string;
  requirements: string;
  isActive: boolean;
  isListed?: boolean;
  listedAt?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  hasApplied?: boolean;
}

export interface JobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
}

export interface SearchFilters {
  title?: string;
  company?: string;
  location?: string;
  jobType?: string;
}

export const jobService = {
  searchJobs: async (filters: SearchFilters) => {
    const params = new URLSearchParams();
    if (filters.title) params.append('title', filters.title);
    if (filters.company) params.append('company', filters.company);
    if (filters.location) params.append('location', filters.location);
    if (filters.jobType) params.append('jobType', filters.jobType);

    const response = await api.get<JobsResponse>(`${API_ROUTES.JOBS.SEARCH}?${params.toString()}`);
    return response.data;
  },
  getJobDetails: async (jobId: string) => {
    const response = await api.get(API_ROUTES.JOBS.GET_BY_ID(jobId));
    return response.data;
  },
  toggleJobListing: async (jobId: string, isListed: boolean): Promise<{ data: { job: Job } }> => {
    const response = await api.patch<{ data: { job: Job } }>(API_ROUTES.JOBS.TOGGLE_LISTING(jobId), { isListed });
    return response.data;
  },
};