import { z } from 'zod';
export const CompanyRegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  companyName: z.string().min(2, 'Company name must be at least 2 characters'),
});

export const CompanyLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const CompanyProfileSchema = z.object({
  companyName: z.string().min(2, 'Company name must be at least 2 characters').optional().or(z.literal('')),
  industry: z.string().min(1, 'Industry is required').optional().or(z.literal('')),
  size: z.string().min(1, 'Company size is required').optional().or(z.literal('')),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  foundedYear: z.number().min(1900, 'Invalid founded year').optional(),
  headquarters: z.string().max(200, 'Headquarters too long').optional().or(z.literal('')),
  phone: z.string().max(20, 'Phone too long').optional().or(z.literal('')),
  linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().or(z.literal('')),
  businessType: z.string().max(100, 'Business type too long').optional().or(z.literal('')),
  contactPersonName: z.string().min(1, 'Contact person name is required').optional().or(z.literal('')),
  contactPersonTitle: z.string().min(1, 'Contact person title is required').optional().or(z.literal('')),
  contactPersonEmail: z.string().email('Invalid contact person email').optional().or(z.literal('')),
  contactPersonPhone: z.string().max(20, 'Contact person phone too long').optional().or(z.literal('')),
});

export const CompanyProfileCompletionSchema = z.object({
  industry: z.string().min(1, 'Industry is required'),
  size: z.string().min(1, 'Company size is required'),
  website: z.string().url().optional(),
  description: z.string().min(1, 'Description is required'),
  headquarters: z.string().min(1, 'Headquarters is required'),
  contactPersonName: z.string().min(1, 'Contact person name is required'),
  contactPersonTitle: z.string().min(1, 'Contact person title is required'),
  contactPersonEmail: z.string().email('Invalid contact person email'),
  contactPersonPhone: z.string().min(1, 'Contact person phone is required'),
});

export const CompanyGenerateOTPSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const CompanyVerifyOTPSchema = z.object({
  email: z.string().email('Invalid email format'),
  otp: z.string().length(6, 'OTP must be 6 characters'),
});
export const CompanyStep2Schema = z.object({
  industry: z.string().min(1, 'Industry is required'),
  size: z.string().min(1, 'Company size is required'),
  website: z.string().url('Invalid website URL').optional(),
  description: z.string().min(1, 'Description is required'),
  headquarters: z.string().min(1, 'Headquarters is required'),
});
export const CompanyStep3Schema = z.object({
  contactPersonName: z.string().min(1, 'Contact person name is required'),
  contactPersonTitle: z.string().min(1, 'Contact person title is required'),
  contactPersonEmail: z.string().email('Invalid contact person email'),
  contactPersonPhone: z.string().min(1, 'Contact person phone is required'),
});

export const RejectCompanySchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(500, 'Reason too long'),
});

export type CompanyRegisterInput = z.infer<typeof CompanyRegisterSchema>;
export type CompanyLoginInput = z.infer<typeof CompanyLoginSchema>;
export type CompanyStep2Input = z.infer<typeof CompanyStep2Schema>;
export type CompanyStep3Input = z.infer<typeof CompanyStep3Schema>;
export type CompanyProfileInput = z.infer<typeof CompanyProfileSchema>;
export type CompanyGenerateOTPInput = z.infer<typeof CompanyGenerateOTPSchema>;
export type CompanyVerifyOTPInput = z.infer<typeof CompanyVerifyOTPSchema>;
export type RejectCompanyInput = z.infer<typeof RejectCompanySchema>;