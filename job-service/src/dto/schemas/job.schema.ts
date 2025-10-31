import { z } from 'zod';

export const CreateJobSchema = z.object({
  title: z.string().min(1, 'Title is required').transform(val => val.trim()),
  description: z.string().min(1, 'Description is required').transform(val => val.trim()),
  company: z.string().min(1, 'Company is required').transform(val => val.trim()),
  location: z.string().min(1, 'Location is required').transform(val => val.trim()),
  jobType: z.string().min(1, 'Job type is required'),
  requirements: z.array(z.string()).min(1, 'At least one requirement is needed').transform(arr => arr.map(r => r.trim())),
  salary: z.number().nullable(), 
  benefits: z.array(z.string()).optional().default([]).transform(arr => arr.map(b => b.trim())),
  experienceLevel: z.string().min(1, 'Experience level is required'),
  education: z.string().min(1, 'Education requirement is required'),
  applicationDeadline: z.string().min(1, 'Application deadline is required'),
  workLocation: z.string().min(1, 'Work location is required').transform(val => val.trim()),
  isActive: z.boolean().default(true),
});

export const UpdateJobSchema = z.object({
  title: z.string().min(1, 'Title is required').optional().transform(val => val?.trim()),
  description: z.string().min(1, 'Description is required').optional().transform(val => val?.trim()),
  company: z.string().min(1, 'Company is required').optional().transform(val => val?.trim()),
  location: z.string().min(1, 'Location is required').optional().transform(val => val?.trim()),
  jobType: z.string().min(1, 'Job type is required').optional(),
  requirements: z.array(z.string()).min(1, 'At least one requirement is needed').optional().transform(arr => arr?.map(r => r.trim())),
  salary: z.number().nullable().optional(),
  benefits: z.array(z.string()).optional().transform(arr => arr?.map(b => b.trim())),
  experienceLevel: z.string().min(1, 'Experience level is required').optional(),
  education: z.string().min(1, 'Education requirement is required').optional(),
  applicationDeadline: z.string().min(1, 'Application deadline is required').optional(),
  workLocation: z.string().min(1, 'Work location is required').optional().transform(val => val?.trim()),
  isActive: z.boolean().optional(),
});

export const JobSearchSchema = z.object({
  query: z.string().optional(),
  title: z.string().optional(), 
  company: z.string().optional(), 
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

export const JobSuggestionsSchema = z.object({
  q: z.string().min(1, 'Query parameter is required'),
});

export type CreateJobInput = z.infer<typeof CreateJobSchema>;
export type UpdateJobInput = z.infer<typeof UpdateJobSchema>;
export type JobSearchInput = z.infer<typeof JobSearchSchema>;
export type JobSuggestionsInput = z.infer<typeof JobSuggestionsSchema>;