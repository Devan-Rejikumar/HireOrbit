/**
 * Application Messages
 * Centralized success, error, and validation messages
 */

export const MESSAGES = {
  SUCCESS: {
    // Subscription Plan Messages
    PLAN_CREATED: 'Subscription plan created successfully',
    PLAN_UPDATED: 'Subscription plan updated successfully',
    PLAN_DELETED: 'Subscription plan deleted successfully',
    PLAN_LOADED: 'Subscription plans retrieved successfully',
    
    // Job Messages
    JOB_CREATED: 'Job created successfully',
    JOB_UPDATED: 'Job updated successfully',
    JOB_DELETED: 'Job deleted successfully',
    JOB_LISTED: 'Job listed successfully. It will now be visible to job seekers.',
    JOB_UNLISTED: 'Job unlisted successfully. It will no longer be visible to job seekers.',
    
    // Application Messages
    APPLICATION_SUBMITTED: 'Application submitted successfully',
    APPLICATION_UPDATED: 'Application updated successfully',
    
    // Profile Messages
    PROFILE_UPDATED: 'Profile updated successfully',
    PASSWORD_CHANGED: 'Password changed successfully',
    
    // Company Messages
    COMPANY_PROFILE_UPDATED: 'Company profile updated successfully',
    COMPANY_REAPPLICATION_SUBMITTED: 'Reapplication submitted successfully',
    
    // Interview Messages
    INTERVIEW_SCHEDULED: 'Interview scheduled successfully',
    INTERVIEW_UPDATED: 'Interview updated successfully',
    INTERVIEW_CANCELLED: 'Interview cancelled successfully',
    
    // General
    OPERATION_SUCCESS: 'Operation completed successfully',
    SAVED: 'Saved successfully',
    LOGIN_REQUIRED: 'Please login again',
  },
  
  ERROR: {
    // Subscription Plan Errors
    PLAN_LOAD_FAILED: 'Failed to load subscription plans',
    PLAN_SAVE_FAILED: 'Failed to save subscription plan',
    PLAN_DELETE_FAILED: 'Failed to delete subscription plan',
    PLAN_NOT_FOUND: 'Subscription plan not found',
    
    // Job Errors
    JOB_LOAD_FAILED: 'Failed to load jobs',
    JOB_SAVE_FAILED: 'Failed to save job',
    JOB_DELETE_FAILED: 'Failed to delete job',
    JOB_NOT_FOUND: 'Job not found',
    JOB_TOGGLE_FAILED: 'Failed to update job listing status',
    
    // Application Errors
    APPLICATION_SUBMIT_FAILED: 'Failed to submit application',
    APPLICATION_LOAD_FAILED: 'Failed to load applications',
    
    // Profile Errors
    PROFILE_LOAD_FAILED: 'Failed to load profile',
    PROFILE_UPDATE_FAILED: 'Failed to update profile',
    PASSWORD_CHANGE_FAILED: 'Failed to change password',
    
    // Company Errors
    COMPANY_PROFILE_LOAD_FAILED: 'Failed to load company profile',
    COMPANY_PROFILE_UPDATE_FAILED: 'Failed to update company profile',
    COMPANY_REAPPLICATION_FAILED: 'Failed to submit reapplication',
    
    // Interview Errors
    INTERVIEW_SCHEDULE_FAILED: 'Failed to schedule interview',
    INTERVIEW_UPDATE_FAILED: 'Failed to update interview',
    INTERVIEW_CANCEL_FAILED: 'Failed to cancel interview',
    
    // Authentication Errors
    AUTH_FAILED: 'Authentication failed',
    TOKEN_EXPIRED: 'Session expired. Please login again',
    UNAUTHORIZED: 'You are not authorized to perform this action',
    
    // Network Errors
    NETWORK_ERROR: 'Network error. Please check your connection',
    SERVER_ERROR: 'Server error. Please try again later',
    REQUEST_FAILED: 'Request failed. Please try again',
    
    // Checkout/Subscription Errors
    INVALID_PLAN_SELECTION: 'Invalid plan selection',
    PLAN_NOT_FOUND: 'Plan not found',
    PLAN_DETAILS_LOAD_FAILED: 'Failed to load plan details',
    
    // Revenue/Admin Errors
    REVENUE_STATS_LOAD_FAILED: 'Failed to load revenue statistics',
    TRANSACTION_HISTORY_LOAD_FAILED: 'Failed to load transaction history',
    STRIPE_SYNC_FAILED: 'Failed to sync transactions from Stripe',
    
    // General
    OPERATION_FAILED: 'Operation failed. Please try again',
    UNKNOWN_ERROR: 'An unexpected error occurred',
  },
  
  VALIDATION: {
    // Subscription Plan Validation
    PLAN_NAME_REQUIRED: 'Plan name is required',
    INVALID_MONTHLY_PRICE: 'Monthly price must be a valid non-negative number',
    INVALID_YEARLY_PRICE: 'Yearly price must be a valid non-negative number',
    PRICE_REQUIRED: 'At least one price (monthly or yearly) must be provided',
    
    // Job Validation
    JOB_TITLE_REQUIRED: 'Job title is required',
    JOB_DESCRIPTION_REQUIRED: 'Job description is required',
    JOB_LOCATION_REQUIRED: 'Job location is required',
    JOB_TYPE_REQUIRED: 'Job type is required',
    APPLICATION_DEADLINE_REQUIRED: 'Application deadline is required',
    
    // Profile Validation
    NAME_REQUIRED: 'Name is required',
    EMAIL_REQUIRED: 'Email is required',
    EMAIL_INVALID: 'Please enter a valid email address',
    PASSWORD_REQUIRED: 'Password is required',
    PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters',
    PASSWORD_MISMATCH: 'Passwords do not match',
    CURRENT_PASSWORD_REQUIRED: 'Current password is required',
    NEW_PASSWORD_REQUIRED: 'New password is required',
    PASSWORD_COMPLEXITY: 'New password must contain uppercase, lowercase, and number',
    PASSWORD_SAME_AS_CURRENT: 'New password must be different from current password',
    
    // Company Validation
    COMPANY_NAME_REQUIRED: 'Company name is required',
    COMPANY_EMAIL_REQUIRED: 'Company email is required',
    REAPPLICATION_REASON_REQUIRED: 'Reapplication reason is required',
    
    // Interview Validation
    INTERVIEW_DATE_REQUIRED: 'Interview date is required',
    INTERVIEW_TIME_REQUIRED: 'Interview time is required',
    INTERVIEW_TYPE_REQUIRED: 'Interview type is required',
    
    // General
    REQUIRED_FIELD: 'This field is required',
    INVALID_INPUT: 'Invalid input provided',
  },
  
  INFO: {
    LOADING: 'Loading...',
    PROCESSING: 'Processing...',
    SAVING: 'Saving...',
    DELETING: 'Deleting...',
    NO_DATA: 'No data available',
    NO_RESULTS: 'No results found',
  },
  
  WARNING: {
    UNSAVED_CHANGES: 'You have unsaved changes. Are you sure you want to leave?',
    DELETE_CONFIRMATION: 'Are you sure you want to delete this item?',
    CANCEL_CONFIRMATION: 'Are you sure you want to cancel?',
  },
} as const;

