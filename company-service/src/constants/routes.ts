/**
 * Company Service Route Constants
 * All route paths for the company service are defined here
 */

export const COMPANY_ROUTES = {
  // Authentication routes
  REGISTER: '/register',
  LOGIN: '/login',
  REFRESH_TOKEN: '/refresh-token',
  LOGOUT: '/logout',
  
  // OTP routes
  GENERATE_OTP: '/generate-otp',
  VERIFY_OTP: '/verify-otp',
  RESEND_OTP: '/resend-otp',
  
  // Password routes
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // Profile routes (protected)
  GET_ME: '/me',
  GET_PROFILE: '/profile',
  UPDATE_PROFILE: '/profile',
  GET_PROFILE_STEP: '/profile/step',
  COMPLETE_STEP_2: '/profile/step2',
  COMPLETE_STEP_3: '/profile/step3',
  GET_JOB_COUNT: '/job-count',
  REAPPLY: '/reapply',
  GET_REAPPLY_STATUS: '/reapply-status',
  
  // Admin routes (protected)
  GET_ALL_COMPANIES: '/companies',
  BLOCK_COMPANY: '/companies/:id/block',
  UNBLOCK_COMPANY: '/companies/:id/unblock',
  GET_PENDING_COMPANIES: '/admin/pending',
  GET_ALL_COMPANIES_FOR_ADMIN: '/admin/all',
  GET_COMPANY_DETAILS_FOR_ADMIN: '/admin/:id',
  APPROVE_COMPANY: '/admin/:id/approve',
  REJECT_COMPANY: '/admin/:id/reject',
  
  // Public routes
  SEARCH_COMPANY: '/search',
} as const;

