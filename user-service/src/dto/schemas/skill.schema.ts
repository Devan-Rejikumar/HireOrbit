import { z } from 'zod';

export const CreateSkillSchema = z.object({
  name: z.string().min(1, 'Skill name is required').max(100, 'Skill name too long'),
  category: z.string().max(100, 'Category too long').optional(),
});

export const UpdateSkillSchema = z.object({
  name: z.string().min(1, 'Skill name is required').max(100, 'Skill name too long').optional(),
  category: z.string().max(100, 'Category too long').optional(),
  isActive: z.boolean().optional(),
});

export type CreateSkillInput = z.infer<typeof CreateSkillSchema>;
export type UpdateSkillInput = z.infer<typeof UpdateSkillSchema>;


