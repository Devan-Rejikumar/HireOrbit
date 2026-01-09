import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long').optional(),
  headline: z.string().max(100, 'Headline too long').optional(),
  about: z.string().max(500, 'About too long').optional(),
  location: z.string().max(100, 'Location too long').optional(),
  phone: z.string().regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format').optional(),
  profilePicture: z.string().url('Invalid profile picture URL').optional(),
  skills: z.array(z.string().min(1, 'Skill cannot be empty')).optional()
});

export const ExperienceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  company: z.string().min(1, 'Company is required'),
  location: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required').transform((str) => new Date(str)),
  endDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  description: z.string().max(500, 'Description too long').optional(),
  isCurrentRole: z.boolean().default(false)
});

export const EducationSchema = z.object({
  institution: z.string().min(1, 'Institution is required'),
  degree: z.string().min(1, 'Degree is required'),
  fieldOfStudy: z.string().max(100, 'Field of study too long').optional(),
  startDate: z.string().min(1, 'Start date is required').transform((str) => new Date(str)),
  endDate: z.string().optional().transform((str) => str ? new Date(str) : undefined),
  grade: z.string().max(20, 'Grade too long').optional(),
  description: z.string().max(500, 'Description too long').optional()
});

export const SkillsSchema = z.object({
  skills: z.array(z.string().min(1, 'Skill cannot be empty')).min(1, 'At least one skill required')
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type ExperienceInput = z.infer<typeof ExperienceSchema>;
export type EducationInput = z.infer<typeof EducationSchema>;
export type SkillsInput = z.infer<typeof SkillsSchema>;