/**
 * Application Service Route Constants
 * All route paths for the application service are defined here
 */

export const APPLICATION_ROUTES = {
  API_BASE_PATH: '/api/applications',
  APPLY_FOR_JOB: '/apply',
  GET_APPLICATION_BY_ID: '/:id',
  WITHDRAW_APPLICATION: '/:id/withdraw',
  UPDATE_APPLICATION_STATUS: '/:id/status',
  BULK_UPDATE_STATUS: '/bulk/status',
  GET_USER_APPLICATIONS: '/user/applications',
  CHECK_APPLICATION_STATUS: '/check-status/:jobId',
  GET_COMPANY_APPLICATIONS: '/company/applications',
  GET_APPLICATION_DETAILS: '/company/:id/details',
  SEARCH_APPLICATIONS: '/search/applications',
  GET_COMPANY_STATISTICS: '/company/statistics',
  GET_TOP_APPLICANTS: '/admin/top-applicants',
  GET_TOP_JOBS: '/admin/top-jobs',
  VIEW_RESUME: '/:applicationId/resume/view',
  DOWNLOAD_RESUME: '/:applicationId/resume/download',
  ADD_APPLICATION_NOTE: '/:id/notes',
  CREATE_OFFER: '/:applicationId/offer',
} as const;

export const INTERVIEW_ROUTES = {
  API_BASE_PATH: '/api/interviews',
  SCHEDULE_INTERVIEW: '/',
  GET_INTERVIEW_BY_ID: '/:id',
  UPDATE_INTERVIEW: '/:id',
  CANCEL_INTERVIEW: '/:id',
  MAKE_INTERVIEW_DECISION: '/:id/decision',
  GET_INTERVIEWS_BY_APPLICATION: '/application/:applicationId',
  GET_COMPANY_INTERVIEWS: '/company/all',
  GET_CANDIDATE_INTERVIEWS: '/candidate/all',
  GET_WEBRTC_CONFIG: '/:id/webrtc-config',
} as const;

export const OFFER_ROUTES = {
  API_BASE_PATH: '/api/offers',
  GET_USER_OFFERS: '/users/me/offers',
  GET_COMPANY_OFFERS: '/companies/me/offers',
  GET_OFFER_BY_ID: '/:offerId',
  ACCEPT_OFFER: '/:offerId/accept',
  REJECT_OFFER: '/:offerId/reject',
  DOWNLOAD_OFFER_PDF: '/:offerId/pdf',
} as const;

export const ATS_ROUTES = {
  API_BASE_PATH: '/api/applications/ats',
  ANALYZE_RESUME: '/analyze',
} as const;

export const OFFER_TEMPLATE_ROUTES = {
  API_BASE_PATH: '/api/offers',
  GET_TEMPLATE: '/template',
  CREATE_OR_UPDATE_TEMPLATE: '/template',
  UPLOAD_LOGO: '/template/logo',
  UPLOAD_SIGNATURE: '/template/signature',
  PREVIEW_TEMPLATE: '/template/preview',
} as const;

