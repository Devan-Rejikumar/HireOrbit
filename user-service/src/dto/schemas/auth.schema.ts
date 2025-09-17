import { z } from 'zod';


export const UserRegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['user', 'admin']).default('user')
});


export const UserLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

export const GenerateOTPSchema = z.object({
  email: z.string().email('Invalid email format')
});

export const VerifyOTPSchema = z.object({
  email: z.string().email('Invalid email format'),
  otp: z.string().length(6, 'OTP must be 6 characters')
});


export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format')
});

export const ResetPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords don\'t match',
  path: ['confirmPassword']
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});
export const UpdateNameSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim()
});
export const GoogleAuthSchema = z.object({
  idToken: z.string().min(1, 'ID token is required'),
  email: z.string().email('Invalid email format'),
  name: z.string().optional(),
  photoURL: z.string().url('Invalid photo URL').optional()
});
export const ResendOTPSchema = GenerateOTPSchema;

export type UserRegisterInput = z.infer<typeof UserRegisterSchema>;
export type UserLoginInput = z.infer<typeof UserLoginSchema>;
export type GenerateOTPInput = z.infer<typeof GenerateOTPSchema>;
export type VerifyOTPInput = z.infer<typeof VerifyOTPSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;
export type UpdateNameInput = z.infer<typeof UpdateNameSchema>;
export type GoogleAuthInput = z.infer<typeof GoogleAuthSchema>;
export type ResendOTPInput = z.infer<typeof ResendOTPSchema>;