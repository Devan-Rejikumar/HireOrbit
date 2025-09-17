export interface IJob {
  id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  salary?: number;
  jobType: string;
  requirements: string[];
  benefits: string[];
  experienceLevel: string;
  education: string;
  applicationDeadline: string;
  workLocation: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobSearchFilters {
  title?: string;
  company?: string;
  location?: string;
  jobType?: string;
  experienceLevel?: string;
  education?: string;
  workLocation?: string;
  minSalary?: number;
  maxSalary?: number;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'title' | 'salary';
  sortOrder?: 'asc' | 'desc';
}