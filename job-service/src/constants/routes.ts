/**
 * Job Service Route Constants
 * All route paths for the job service are defined here
 */

export const JOB_ROUTES = {
  // Job CRUD routes
  CREATE_JOB: '/',
  GET_ALL_JOBS: '/',
  GET_JOB_BY_ID: '/:id',
  UPDATE_JOB: '/:id',
  DELETE_JOB: '/:id',
  
  // Search and suggestions
  SEARCH_JOBS: '/search',
  GET_JOB_SUGGESTIONS: '/suggestions',
  
  // Company-specific routes
  GET_JOBS_BY_COMPANY: '/company/:companyId',
  GET_JOB_COUNT_BY_COMPANY: '/company/:companyId/count',
} as const;

