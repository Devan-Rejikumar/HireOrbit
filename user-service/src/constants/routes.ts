/**
 * User Service Route Constants
 * All route paths for the user service are defined here
 */

export const USER_ROUTES = {

  REGISTER: '/register',
  LOGIN: '/login',
  REFRESH_TOKEN: '/refresh-token',
  LOGOUT: '/logout',
  GOOGLE_AUTH: '/google-auth',
  GENERATE_OTP: '/generate-otp',
  GENERATE_VERIFICATION_OTP: '/generate-verification-otp',
  VERIFY_OTP: '/verify-otp',
  RESEND_OTP: '/resend-otp',
  FORGOT_PASSWORD: '/forgot-password',
  VERIFY_PASSWORD_RESET_OTP: '/verify-password-reset-otp',
  RESET_PASSWORD: '/reset-password',
  CHANGE_PASSWORD: '/change-password',
  GET_ME: '/me',
  GET_USER_BY_ID: '/:id',
  UPDATE_NAME: '/update-name',
} as const;

export const PROFILE_ROUTES = {
  GET_CURRENT_PROFILE: '/current',
  CREATE_PROFILE: '/',
  GET_PROFILE: '/',
  UPDATE_PROFILE: '/',
  DELETE_PROFILE: '/',
  GET_FULL_PROFILE: '/full',
  ADD_EXPERIENCE: '/experience',
  UPDATE_EXPERIENCE: '/experience/:id',
  DELETE_EXPERIENCE: '/experience/:id',
  ADD_EDUCATION: '/education',
  UPDATE_EDUCATION: '/education/:id',
  DELETE_EDUCATION: '/education/:id',
  
 
  UPLOAD_RESUME: '/resume',
  GET_RESUME: '/resume',
  DELETE_RESUME: '/resume',
  

  ADD_CERTIFICATION: '/certifications',
  GET_CERTIFICATIONS: '/certifications',
  GET_CERTIFICATION_BY_ID: '/certifications/:certificationId',
  UPDATE_CERTIFICATION: '/certifications/:certificationId',
  DELETE_CERTIFICATION: '/certifications/:certificationId',
  
  
  ADD_ACHIEVEMENT: '/achievements',
  GET_ACHIEVEMENTS: '/achievements',
  GET_ACHIEVEMENT_BY_ID: '/achievements/:achievementId',
  UPDATE_ACHIEVEMENT: '/achievements/:achievementId',
  DELETE_ACHIEVEMENT: '/achievements/:achievementId',
} as const;

export const ADMIN_ROUTES = {

  LOGIN: '/login',
  REFRESH_TOKEN: '/refresh-token',
  LOGOUT: '/logout',
  GET_ME: '/me',
  

  GET_ALL_USERS: '/users',
  BLOCK_USER: '/users/:id/block',
  UNBLOCK_USER: '/users/:id/unblock',
} as const;

