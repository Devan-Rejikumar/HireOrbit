import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';

export interface Job {
  id: string;
  title: string;
  description: string;
  company: string;
  companyId?: string;
  location: string;
  salary?: string;
  jobType: string;
  requirements: string[];
  benefits: string[];
  createdAt: string;
  hasApplied?: boolean;
}

interface JobsApiResponse {
  success: boolean;
  data: {
    jobs: Job[];
  };
  message: string;
}

// Hook to fetch all jobs
export const useJobs = () => {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: async () => {
      const response = await api.get<JobsApiResponse>('/jobs');
      if (response.data.success && response.data.data?.jobs) {
        return response.data.data.jobs;
      }
      return [];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - jobs don't change frequently
    cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
};

// Hook to fetch featured jobs (first 4)
export const useFeaturedJobs = () => {
  const { data: allJobs = [], ...rest } = useJobs();
  return {
    data: allJobs.slice(0, 4),
    ...rest
  };
};

