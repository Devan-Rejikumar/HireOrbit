import { z } from 'zod';

export const CreateInterviewSchema = z.object({
  applicationId: z.string().min(1, 'Application ID is required'),
  scheduledAt: z.string().datetime('Invalid date format'),
  duration: z.number().min(15, 'Duration must be at least 15 minutes').max(480, 'Duration cannot exceed 8 hours'),
  type: z.enum(['ONLINE', 'OFFLINE', 'PHONE'], {
    message: 'Type must be ONLINE, OFFLINE, or PHONE',
  }),
  location: z.string().optional(),
  meetingLink: z.string().url('Invalid meeting link URL').optional(),
  notes: z.string().max(1000, 'Notes cannot exceed 1000 characters').optional(),
});

export const UpdateInterviewSchema = z.object({
  scheduledAt: z.string().datetime('Invalid date format').optional(),
  duration: z.number().min(15).max(480).optional(),
  type: z.enum(['ONLINE', 'OFFLINE', 'PHONE']).optional(),
  location: z.string().optional(),
  meetingLink: z.string().url('Invalid meeting link URL').optional(),
  notes: z.string().max(1000).optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'SELECTED', 'REJECTED'], {
    message: 'Invalid status',
  }).optional(),
});

export const InterviewDecisionSchema = z.object({
  status: z.enum(['SELECTED', 'REJECTED'], {
    message: 'Decision must be SELECTED or REJECTED',
  }),
  decisionReason: z.string().min(10, 'Reason must be at least 10 characters').max(1000, 'Reason cannot exceed 1000 characters'),
  feedback: z.string().max(2000, 'Feedback cannot exceed 2000 characters').optional(),
});

export type CreateInterviewInput = z.infer<typeof CreateInterviewSchema>;
export type UpdateInterviewInput = z.infer<typeof UpdateInterviewSchema>;
export type InterviewDecisionInput = z.infer<typeof InterviewDecisionSchema>;