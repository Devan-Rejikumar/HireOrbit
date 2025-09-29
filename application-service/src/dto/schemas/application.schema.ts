import { z } from 'zod';

export const CreateApplicationSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  companyId: z.string().min(1, 'Company ID is required'),
  coverLetter: z.string().min(10, 'Cover letter must be at least 10 characters'),
  expectedSalary: z.string().min(1, 'Expected salary is required'),
  availability: z.string().min(1, 'Availability is required'),
  experience: z.string().min(1, 'Experience is required'),
  resumeUrl: z.string().url('Invalid resume URL').optional()
});

export const UpdateApplicationStatusSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'ACCEPTED', 'WITHDRAWN']),
  reason: z.string().optional()
});

export const AddApplicationNoteSchema = z.object({
  note: z.string().min(1, 'Note is required'),
  addedBy: z.string().uuid('Invalid user ID format')
});

export type CreateApplicationInput = z.infer<typeof CreateApplicationSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof UpdateApplicationStatusSchema>;
export type AddApplicationNoteInput = z.infer<typeof AddApplicationNoteSchema>;