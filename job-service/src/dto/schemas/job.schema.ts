import { z } from 'zod';

export const CreateJobSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  company: z.string().min(1, 'Company is required'),
  location: z.string().min(1, 'Location is required'),
  jobType: z.string().min(1, 'Job type is required'),
  requirements: z.array(z.string()).min(1, 'At least one requirement is needed'),
  salary: z.number().nullable(), // Keep as nullable
  benefits: z.array(z.string()).optional().default([]),
  experienceLevel: z.string().min(1, 'Experience level is required'),
  education: z.string().min(1, 'Education requirement is required'),
  applicationDeadline: z.string().min(1, 'Application deadline is required'),
  workLocation: z.string().min(1, 'Work location is required'),
  isActive: z.boolean().default(true),
});

export const UpdateJobSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  company: z.string().min(1, 'Company is required').optional(),
  location: z.string().min(1, 'Location is required').optional(),
  jobType: z.string().min(1, 'Job type is required').optional(),
  requirements: z.array(z.string()).min(1, 'At least one requirement is needed').optional(),
  salary: z.number().nullable().optional(),
  benefits: z.array(z.string()).optional(),
  experienceLevel: z.string().min(1, 'Experience level is required').optional(),
  education: z.string().min(1, 'Education requirement is required').optional(),
  applicationDeadline: z.string().min(1, 'Application deadline is required').optional(),
  workLocation: z.string().min(1, 'Work location is required').optional(),
  isActive: z.boolean().optional(),
});

export const JobSearchSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  jobType: z.string().optional(),
  experienceLevel: z.string().optional(),
  education: z.string().optional(),
  workLocation: z.string().optional(),
  minSalary: z.number().optional(),
  maxSalary: z.number().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'title', 'salary']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const PaginationSchema = z.object({
  page: z.number().min(1, 'Page must be at least 1').default(1),
  limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10),
});

export const JobApplicationSchema = z.object({
  jobId: z.string().uuid('Invalid job ID'),
  coverLetter: z.string().min(1, 'Cover letter is required'),
  resume: z.string().min(1, 'Resume is required'),
});

export const UpdateJobApplicationSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'accepted', 'rejected']),
  notes: z.string().optional(),
});

export const JobSuggestionsSchema = z.object({
  q: z.string().min(1, 'Query parameter is required'),
});

export type CreateJobInput = z.infer<typeof CreateJobSchema>;
export type UpdateJobInput = z.infer<typeof UpdateJobSchema>;
export type JobSearchInput = z.infer<typeof JobSearchSchema>;
export type JobApplicationInput = z.infer<typeof JobApplicationSchema>;
export type UpdateJobApplicationInput = z.infer<typeof UpdateJobApplicationSchema>;
export type JobSuggestionsInput = z.infer<typeof JobSuggestionsSchema>;