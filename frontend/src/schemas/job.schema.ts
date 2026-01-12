import { z } from 'zod';

export const CreateJobFormSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .transform(val => val.trim()),
  description: z.string()
    .min(50, 'Description must be at least 50 characters')
    .max(5000, 'Description must be less than 5000 characters')
    .transform(val => val.trim()),
  company: z.string()
    .min(1, 'Company name is required')
    .max(200, 'Company name must be less than 200 characters')
    .transform(val => val.trim()),
  location: z.string()
    .min(1, 'Location is required')
    .max(200, 'Location must be less than 200 characters')
    .transform(val => val.trim()),
  jobType: z.string().min(1, 'Job type is required'),
  requirements: z.array(z.string().max(500, 'Requirement must be less than 500 characters'))
    .min(1, 'At least one requirement is required')
    .transform(arr => arr.map(r => r.trim()).filter(r => r.length > 0)),
  salary: z.string().optional().transform(val => {
    if (!val || val.trim() === '') return null;
    
    const trimmed = val.trim();
    let parsed: number | null = null;
    
    if (trimmed.includes('-')) {
      const parts = trimmed.split('-').map(part => part.trim());
      if (parts.length === 2) {
        const min = parseInt(parts[0]);
        const max = parseInt(parts[1]);
        if (!isNaN(min) && !isNaN(max)) {
          parsed = Math.round((min + max) / 2);
        }
      }
    } else {
      parsed = parseInt(trimmed);
      if (isNaN(parsed)) {
        parsed = null;
      }
    }
    
    return parsed;
  }).refine((val) => {
    // If null (empty), it's valid (optional field)
    if (val === null) return true;
    // Otherwise, check if it's a valid number
    return val !== null;
  }, {
    message: 'Please enter a valid salary (e.g., 75000 or 40000-80000)',
  }).refine((val) => {
    if (val === null) return true;
    return val >= 0;
  }, {
    message: 'Salary cannot be negative',
  }).refine((val) => {
    if (val === null) return true;
    return val <= 1000000000;
  }, {
    message: 'Salary exceeds maximum allowed value',
  }),
  benefits: z.array(z.string().max(500, 'Benefit must be less than 500 characters'))
    .optional()
    .default([])
    .transform(arr => arr?.map(b => b.trim()).filter(b => b.length > 0) || []),
  experienceLevel: z.string().min(1, 'Experience level is required'),
  education: z.string().min(1, 'Education requirement is required'),
  applicationDeadline: z.string()
    .min(1, 'Application deadline is required')
    .refine((date) => {
      const deadlineDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      deadlineDate.setHours(0, 0, 0, 0);
      
      if (isNaN(deadlineDate.getTime())) return false;
      return deadlineDate >= today;
    }, {
      message: 'Application deadline must be today or a future date',
    }),
  workLocation: z.string().min(1, 'Work location is required').transform(val => val.trim()),
});

export type CreateJobFormInput = z.infer<typeof CreateJobFormSchema>;

