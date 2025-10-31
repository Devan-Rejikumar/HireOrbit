export interface JobResponse {
  id: string;
  title: string;
  description: string;
  company: string;
  companyId?: string;
  location: string;
  salary?: number;
  jobType: string;
  requirements: string[];
  benefits: string[];
  experienceLevel: string;
  education: string;
  applicationDeadline: Date;
  workLocation: string;
  isActive: boolean; // ✅ Add isActive field
  createdAt: Date;
  updatedAt: Date;
}

export interface JobApplicationResponse {
  id: string;
  userId: string;
  jobId: string;
  status: string;
  appliedAt: Date;
}

export interface JobSearchResponse {
  jobs: JobResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}