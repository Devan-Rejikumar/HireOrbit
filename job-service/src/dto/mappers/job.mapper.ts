import { JobResponse, JobApplicationResponse } from '../responses/job.response';

export function mapJobToResponse(job: {
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
  createdAt: Date;
  updatedAt: Date;
}): JobResponse {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    company: job.company,
    companyId: job.companyId,
    location: job.location,
    salary: job.salary,
    jobType: job.jobType,
    requirements: job.requirements,
    benefits: job.benefits,
    experienceLevel: job.experienceLevel,
    education: job.education,
    applicationDeadline: job.applicationDeadline,
    workLocation: job.workLocation,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

export function mapJobsToResponse(jobs: Array<{
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
  applicationDeadline: Date;
  workLocation: string;
  createdAt: Date;
  updatedAt: Date;
}>): JobResponse[] {
  return jobs.map(mapJobToResponse);
}

export function mapJobApplicationToResponse(application: {
  id: string;
  userId: string;
  jobId: string;
  status: string;
  appliedAt: Date;
}): JobApplicationResponse {
  return {
    id: application.id,
    userId: application.userId,
    jobId: application.jobId,
    status: application.status,
    appliedAt: application.appliedAt,
  };
}