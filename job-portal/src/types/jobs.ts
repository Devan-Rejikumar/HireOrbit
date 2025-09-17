export interface Job {
  id: string;
  title: string;
  description: string;
  company: string;
  companyId?: string; // Optional for now to not break existing
  location: string;
  salary?: string;
  jobType: string;
  requirements: string[];
  benefits: string[];
  isActive: boolean;
  status?: 'active' | 'inactive' | 'deleted'; 
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobData {
  title: string;
  description: string;
  company: string;
  companyId?: string; 
  location: string;
  salary?: string;
  jobType: string;
  requirements: string[];
  benefits: string[];
}

export interface UpdateJobData {
  title: string;
  description: string;
  company: string;
  location: string;
  salary?: string;
  jobType: string;
  requirements: string[];
  benefits: string[];
}

export type UpdateJobInput = UpdateJobData;