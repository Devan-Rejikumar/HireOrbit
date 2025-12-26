/**
 * Route Constants
 * Centralized route paths for the application
 */

export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  JOBS: '/jobs',
  COMPANIES: '/companies',
  JOB_DETAILS: (id: string) => `/jobs/${id}`,
  JOB_DETAILS_PATTERN: '/jobs/:id',
  
  // User routes
  PROFILE: '/profile',
  USER_DASHBOARD: '/user/dashboard',
  APPLIED_JOBS: '/applied-jobs',
  USER_OFFERS: '/user/offers',
  SCHEDULE: '/schedule',
  MESSAGES: '/messages',
  ATS_CHECKER: '/ats-checker',
  
  // Company routes
  COMPANY_DASHBOARD: '/company/dashboard',
  COMPANY_PROFILE_SETUP: '/company/profile-setup',
  COMPANY_REVIEW_STATUS: '/company/review-status',
  COMPANY_POST_JOB: '/company/post-job',
  COMPANY_JOBS: '/company/jobs',
  COMPANY_SETTINGS: '/company/settings',
  COMPANY_APPLICATIONS: '/company/applications',
  COMPANY_INTERVIEWS: '/company/interviews',
  COMPANY_OFFERS: '/company/offers',
  
  // Admin routes
  ADMIN_LOGIN: '/admin/login',
  ADMIN_REGISTER: '/admin/register',
  ADMIN_DASHBOARD: '/admin/dashboard',
  
  // Subscription routes
  SUBSCRIPTIONS: '/subscriptions',
  SUBSCRIPTIONS_CHECKOUT: '/subscriptions/checkout',
  SUBSCRIPTIONS_STATUS: '/subscriptions/status',
  SUBSCRIPTIONS_MANAGE: '/subscriptions/manage',
  
  // Other routes
  CHAT: '/chat',
  BLOCKED: '/blocked',
  INTERVIEW_VIDEO: (interviewId: string) => `/interview/${interviewId}/video`,
  INTERVIEW_VIDEO_PATTERN: '/interview/:interviewId/video',
  NOTIFICATION_TEST: '/notification-test',
} as const;

