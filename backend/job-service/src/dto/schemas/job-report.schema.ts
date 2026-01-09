import { z } from 'zod';

export const ReportJobSchema = z.object({
  reason: z
    .string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must not exceed 500 characters')
    .trim(),
});

export type ReportJobInput = z.infer<typeof ReportJobSchema>;

