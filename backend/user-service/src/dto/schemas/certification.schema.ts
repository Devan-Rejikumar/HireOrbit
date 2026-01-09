import { z } from 'zod';

export const CreateCertificationSchema = z.object({
  name: z.string()
    .min(1, 'Certification name is required')
    .max(100, 'Certification name must be less than 100 characters')
    .trim(),
  issuer: z.string()
    .min(1, 'Issuer is required')
    .max(100, 'Issuer name must be less than 100 characters')
    .trim(),
  issue_date: z.string()
    .min(1, 'Issue date is required')
    .refine((date) => {
      const issueDate = new Date(date);
      const today = new Date();
      return issueDate <= today;
    }, 'Issue date cannot be in the future'),
  expiry_date: z.string()
    .optional()
    .refine((date) => {
      if (!date) return true;
      const expiryDate = new Date(date);
      const today = new Date();
      return expiryDate > today;
    }, 'Expiry date must be in the future'),
  credential_id: z.string()
    .max(50, 'Credential ID must be less than 50 characters')
    .trim()
    .optional(),
  credential_url: z.string()
    .url('Invalid URL format')
    .max(500, 'Credential URL must be less than 500 characters')
    .trim()
    .optional(),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional(),
  certificate_file: z.string()
    .optional()
});

export const UpdateCertificationSchema = CreateCertificationSchema.partial();

export const CertificationQuerySchema = z.object({
  userId: z.string().uuid('Invalid user ID')
});

export const CertificationParamsSchema = z.object({
  certificationId: z.string().uuid('Invalid certification ID')
});
