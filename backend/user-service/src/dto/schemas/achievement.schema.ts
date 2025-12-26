import { z } from 'zod';

export const CreateAchievementSchema = z.object({
  title: z.string()
    .min(1, 'Achievement title is required')
    .max(100, 'Achievement title must be less than 100 characters')
    .trim(),
  description: z.string()
    .min(1, 'Achievement description is required')
    .max(500, 'Achievement description must be less than 500 characters')
    .trim(),
  date: z.string()
    .min(1, 'Achievement date is required')
    .refine((date) => {
      const achievementDate = new Date(date);
      const today = new Date();
      return achievementDate <= today;
    }, 'Achievement date cannot be in the future'),
  category: z.string()
    .min(1, 'Achievement category is required')
    .max(50, 'Achievement category must be less than 50 characters')
    .trim(),
  achievement_file: z.string()
    .optional()
});

export const UpdateAchievementSchema = CreateAchievementSchema.partial();

export const AchievementQuerySchema = z.object({
  userId: z.string().uuid('Invalid user ID')
});

export const AchievementParamsSchema = z.object({
  achievementId: z.string().uuid('Invalid achievement ID')
});
