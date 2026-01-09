import { z } from 'zod';

export const CreateTemplateSchema = z.object({
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Brand color must be a valid hex color (e.g., #3B82F6)').optional().nullable(),
  fontFamily: z.enum(['Helvetica', 'Times-Roman', 'Courier', 'Symbol', 'ZapfDingbats']).optional().nullable(),
  headerText: z.string().max(500, 'Header text must be less than 500 characters').optional().nullable(),
  introText: z.string().max(2000, 'Introduction text must be less than 2000 characters').optional().nullable(),
  closingText: z.string().max(500, 'Closing text must be less than 500 characters').optional().nullable(),
  footerText: z.string().max(500, 'Footer text must be less than 500 characters').optional().nullable(),
});

export const UpdateTemplateSchema = CreateTemplateSchema;

export const PreviewTemplateSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required'),
  ctc: z.number().min(0, 'CTC must be positive'),
  joiningDate: z.string().min(1, 'Joining date is required'),
  location: z.string().min(1, 'Location is required'),
  offerMessage: z.string().optional(),
  offerExpiryDate: z.string().min(1, 'Offer expiry date is required'),
  candidateName: z.string().min(1, 'Candidate name is required'),
  companyName: z.string().min(1, 'Company name is required'),
});

