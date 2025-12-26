import { z } from 'zod';

export const CreateOfferSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required'),
  ctc: z.number().positive('CTC must be a positive number'),
  joiningDate: z.string().datetime('Invalid joining date format'),
  location: z.string().min(1, 'Location is required'),
  offerMessage: z.string().optional(),
  offerExpiryDate: z.string().datetime('Invalid expiry date format'),
}).refine(
  (data) => new Date(data.offerExpiryDate) > new Date(data.joiningDate),
  {
    message: 'Offer expiry date must be after joining date',
    path: ['offerExpiryDate'],
  }
);

export const GetOffersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED']).optional(),
  search: z.string().optional(),
});

export type CreateOfferInput = z.infer<typeof CreateOfferSchema>;
export type GetOffersQueryInput = z.infer<typeof GetOffersQuerySchema>;

