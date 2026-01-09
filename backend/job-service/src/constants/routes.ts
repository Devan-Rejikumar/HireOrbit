/**
 * Job Service Route Constants
 * All route paths for the job service are defined here
 */

export const JOB_ROUTES = {
  API_BASE_PATH: '/api/jobs',
  CREATE_JOB: '/',
  GET_ALL_JOBS: '/',
  GET_JOB_BY_ID: '/:id',
  UPDATE_JOB: '/:id',
  DELETE_JOB: '/:id',
  SEARCH_JOBS: '/search',
  GET_JOB_SUGGESTIONS: '/suggestions',
  GET_JOBS_BY_COMPANY: '/company/:companyId',
  GET_JOB_COUNT_BY_COMPANY: '/company/:companyId/count',
  REPORT_JOB: '/:jobId/report',
  GET_REPORTED_JOBS: '/admin/reported',
  GET_TOTAL_JOB_COUNT: '/admin/statistics/total',
  GET_JOB_STATISTICS_TIME_SERIES: '/admin/statistics/time-series',
  GET_TOP_COMPANIES: '/admin/top-companies',
  TOGGLE_JOB_LISTING: '/:id/toggle-listing',
} as const;

