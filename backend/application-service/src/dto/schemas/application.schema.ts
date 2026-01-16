import { z } from 'zod';

export const CreateApplicationSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  companyId: z.string().min(1, 'Company ID is required'),
  coverLetter: z.string().min(10, 'Cover letter must be at least 10 characters'),
  expectedSalary: z.string()
    .min(1, 'Expected salary is required')
    .regex(/^[0-9,]+$/, 'Expected salary can only contain numbers and commas')
    .refine((val) => {
      const numericValue = parseInt(val.replace(/,/g, ''), 10);
      return !isNaN(numericValue) && numericValue > 0;
    }, 'Expected salary must be a positive number'),
  availability: z.string().min(1, 'Availability is required'),
  experience: z.string().min(1, 'Experience is required'),
  resumeUrl: z.string().url('Invalid resume URL').optional(),
  resumeBase64: z.string().optional(),
  resumeFileName: z.string().optional(),
});

export const UpdateApplicationStatusSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'ACCEPTED', 'WITHDRAWN']),
  reason: z.string().optional(),
});

export const AddApplicationNoteSchema = z.object({
  note: z.string().min(1, 'Note is required'),
  addedBy: z.string().uuid('Invalid user ID format'),
});

export const WithdrawApplicationSchema = z.object({
  reason: z.string().optional(),
});

export const GetApplicationsQuerySchema = z.object({
  companyId: z.string().optional(),
  userId: z.string().optional(),
  status: z.string().optional(),
  jobId: z.string().optional(),
  search: z.string().optional(),
  atsScoreMin: z.coerce.number().min(0).max(100).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof UpdateApplicationStatusSchema>;
export type AddApplicationNoteInput = z.infer<typeof AddApplicationNoteSchema>;
export type WithdrawApplicationInput = z.infer<typeof WithdrawApplicationSchema>;
export type GetApplicationsQueryInput = z.infer<typeof GetApplicationsQuerySchema>;