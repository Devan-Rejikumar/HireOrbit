import { z } from 'zod';

export const CreateIndustryCategorySchema = z.object({
  name: z.string().min(1, 'Industry category name is required').max(100, 'Industry category name too long'),
});

export const UpdateIndustryCategorySchema = z.object({
  name: z.string().min(1, 'Industry category name is required').max(100, 'Industry category name too long').optional(),
  isActive: z.boolean().optional(),
});

export type CreateIndustryCategoryInput = z.infer<typeof CreateIndustryCategorySchema>;
export type UpdateIndustryCategoryInput = z.infer<typeof UpdateIndustryCategorySchema>;

