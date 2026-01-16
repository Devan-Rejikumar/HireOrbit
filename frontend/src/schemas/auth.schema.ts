import { z } from 'zod';

// Password validation schema - reusable
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^\S+$/, 'Password cannot contain spaces')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number');

// User registration schema
export const UserRegisterSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .regex(/^[a-zA-Z]+(\s[a-zA-Z]+)*$/, 'Name can only contain letters with single spaces between words'),
  email: z.string()
    .email('Please enter a valid email address'),
  password: passwordSchema,
});

// Company registration schema
export const CompanyRegisterSchema = z.object({
  companyName: z.string()
    .trim()
    .min(2, 'Company name must be at least 2 characters')
    .regex(/^[a-zA-Z0-9][a-zA-Z0-9\s&.,'\-]*$/, 'Company name can only contain letters, numbers, spaces, and common punctuation'),
  email: z.string()
    .email('Please enter a valid email address'),
  password: passwordSchema,
});

// Type exports
export type UserRegisterInput = z.infer<typeof UserRegisterSchema>;
export type CompanyRegisterInput = z.infer<typeof CompanyRegisterSchema>;

