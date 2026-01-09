/**
 * API Route Constants
 * Centralized API endpoint paths for the application
 * All API endpoints should be defined here to avoid hardcoded strings
 */

export const API_ROUTES = {
  // User routes
  USERS: {
    BASE: '/users',
    REGISTER: '/users/register',
    LOGIN: '/users/login',
    REFRESH_TOKEN: '/users/refresh-token',
    LOGOUT: '/users/logout',
    GET_ME: '/users/me',
    GET_USER_BY_ID: (id: string) => `/users/${id}`,
    CHANGE_PASSWORD: '/users/change-password',
    GENERATE_OTP: '/users/generate-otp',
    VERIFY_OTP: '/users/verify-otp',
    GENERATE_VERIFICATION_OTP: '/users/generate-verification-otp',
  },

  // Profile routes
  PROFILE: {
    BASE: '/profile',
    GET_CURRENT: '/profile/current',
    GET_PROFILE: '/profile',
    UPDATE_PROFILE: '/profile',
    DELETE_PROFILE: '/profile',
    GET_FULL_PROFILE: '/profile/full',
    RESUME: {
      UPLOAD: '/profile/resume',
      GET: '/profile/resume',
      UPDATE: '/profile/resume',
      DELETE: '/profile/resume',
    },
    EXPERIENCE: {
      ADD: '/profile/experience',
      UPDATE: (id: string) => `/profile/experience/${id}`,
      DELETE: (id: string) => `/profile/experience/${id}`,
    },
    EDUCATION: {
      ADD: '/profile/education',
      UPDATE: (id: string) => `/profile/education/${id}`,
      DELETE: (id: string) => `/profile/education/${id}`,
    },
    CERTIFICATIONS: {
      ADD: '/profile/certifications',
      GET_ALL: '/profile/certifications',
      GET_BY_ID: (id: string) => `/profile/certifications/${id}`,
      UPDATE: (id: string) => `/profile/certifications/${id}`,
      DELETE: (id: string) => `/profile/certifications/${id}`,
    },
    ACHIEVEMENTS: {
      ADD: '/profile/achievements',
      GET_ALL: '/profile/achievements',
      GET_BY_ID: (id: string) => `/profile/achievements/${id}`,
      UPDATE: (id: string) => `/profile/achievements/${id}`,
      DELETE: (id: string) => `/profile/achievements/${id}`,
    },
  },

  // Admin routes
  ADMIN: {
    BASE: '/users/admin',
    LOGIN: '/users/admin/login',
    REFRESH_TOKEN: '/users/admin/refresh-token',
    LOGOUT: '/users/admin/logout',
    GET_ME: '/users/admin/me',
    GET_ALL_USERS: '/users/admin/users',
    BLOCK_USER: (id: string) => `/users/admin/users/${id}/block`,
    UNBLOCK_USER: (id: string) => `/users/admin/users/${id}/unblock`,
    GET_DASHBOARD_STATISTICS: '/users/admin/dashboard/statistics',
    SKILLS: {
      BASE: '/users/admin/skills',
      DETAIL: (id: string) => `/users/admin/skills/${id}`,
    },
    SUBSCRIPTIONS: {
      PLANS: {
        BASE: '/admin/subscriptions/plans',
        DETAIL: (id: string) => `/admin/subscriptions/plans/${id}`,
        PRICE: (id: string) => `/admin/subscriptions/plans/${id}/price`,
      },
      REVENUE: '/admin/subscriptions/revenue',
      TRANSACTIONS: {
        BASE: '/admin/subscriptions/transactions',
        SYNC: '/admin/subscriptions/transactions/sync',
      },
    },
  },

  // Public routes
  PUBLIC: {
    SKILLS: '/skills',
  },

  // Settings routes
  SETTINGS: {
    BASE: '/settings',
    GET: '/settings',
    UPDATE: '/settings',
    UPDATE_LOGO: '/settings/logo',
    UPDATE_COMPANY_NAME: '/settings/company-name',
    UPDATE_ABOUT_PAGE: '/settings/about-page',
  },

  // Job routes
  JOBS: {
    BASE: '/jobs',
    SEARCH: '/jobs/search',
    GET_BY_ID: (id: string) => `/jobs/${id}`,
    TOGGLE_LISTING: (id: string) => `/jobs/${id}/toggle-listing`,
  },

  // Application routes
  APPLICATIONS: {
    BASE: '/applications',
    APPLY: '/applications/apply',
    GET_BY_ID: (id: string) => `/applications/${id}`,
    WITHDRAW: (id: string) => `/applications/${id}/withdraw`,
    UPDATE_STATUS: (id: string) => `/applications/${id}/status`,
    BULK_UPDATE_STATUS: '/applications/bulk/status',
    USER_APPLICATIONS: '/applications/user/applications',
    COMPANY_APPLICATIONS: '/applications/company/applications',
    CHECK_STATUS: (jobId: string) => `/applications/check-status/${jobId}`,
    RESUME: {
      VIEW: (applicationId: string) => `/applications/${applicationId}/resume/view`,
      DOWNLOAD: (applicationId: string) => `/applications/${applicationId}/resume/download`,
    },
    NOTES: (id: string) => `/applications/${id}/notes`,
    HISTORY: (id: string) => `/applications/${id}/history`,
    OFFER: (applicationId: string) => `/applications/${applicationId}/offer`,
    ATS: {
      ANALYZE: '/applications/ats/analyze',
    },
  },

  // Interview routes
  INTERVIEWS: {
    BASE: '/interviews',
    GET_BY_ID: (id: string) => `/interviews/${id}`,
    UPDATE: (id: string) => `/interviews/${id}`,
    DELETE: (id: string) => `/interviews/${id}`,
    DECISION: (id: string) => `/interviews/${id}/decision`,
    BY_APPLICATION: (applicationId: string) => `/interviews/application/${applicationId}`,
    COMPANY_ALL: '/interviews/company/all',
    CANDIDATE_ALL: '/interviews/candidate/all',
    WEBRTC_CONFIG: (id: string) => `/interviews/${id}/webrtc-config`,
  },

  // Offer routes
  OFFERS: {
    BASE: '/offers',
    GET_BY_ID: (offerId: string) => `/offers/${offerId}`,
    USER_OFFERS: '/offers/users/me/offers',
    COMPANY_OFFERS: '/offers/companies/me/offers',
    ACCEPT: (offerId: string) => `/offers/${offerId}/accept`,
    REJECT: (offerId: string) => `/offers/${offerId}/reject`,
    DOWNLOAD_PDF: (offerId: string) => `/offers/${offerId}/pdf`,
    UPLOAD_URL: '/offers/upload-url',
    ATTACH_PDF: (offerId: string) => `/offers/${offerId}/attach-pdf`,
    TEMPLATE: {
      BASE: '/offers/template',
      LOGO: '/offers/template/logo',
      SIGNATURE: '/offers/template/signature',
      PREVIEW: '/offers/template/preview',
    },
  },

  // Subscription routes
  SUBSCRIPTIONS: {
    BASE: '/subscriptions',
    PLANS: '/subscriptions/plans',
    STATUS: '/subscriptions/status',
    CREATE: '/subscriptions',
    CANCEL: (subscriptionId: string) => `/subscriptions/${subscriptionId}/cancel`,
    UPGRADE: (subscriptionId: string) => `/subscriptions/${subscriptionId}/upgrade`,
    LIMITS: {
      JOB_POSTING: '/subscriptions/limits/job-posting',
    },
    FEATURES: {
      CHECK: (featureName: string) => `/subscriptions/features/${featureName}`,
    },
  },

  // Company routes
  COMPANY: {
    BASE: '/company',
    SEARCH: '/company/search',
    REAPPLICATION_STATUS: (companyId: string) => `/companies/${companyId}/reapplication-status`,
    REAPPLY: (companyId: string) => `/companies/${companyId}/reapply`,
    INDUSTRIES: {
      BASE: '/api/industries',
    },
  },

  // Chat routes
  CHAT: {
    BASE: '/chat',
    USER_CONVERSATIONS: (userId: string) => `/chat/users/${userId}/conversations`,
    COMPANY_CONVERSATIONS: (companyId: string) => `/chat/companies/${companyId}/conversations`,
    CONVERSATION: (conversationId: string) => `/chat/conversations/${conversationId}`,
    CONVERSATION_BY_APPLICATION: (applicationId: string) => `/chat/conversations/application/${applicationId}`,
    MESSAGES: (conversationId: string) => `/chat/conversations/${conversationId}/messages`,
    MARK_AS_READ: (conversationId: string) => `/chat/conversations/${conversationId}/read`,
    UNREAD_COUNT: (conversationId: string) => `/chat/conversations/${conversationId}/unread-count`,
    TOTAL_UNREAD_COUNT: (userId: string) => `/chat/users/${userId}/total-unread-count`,
    CONVERSATIONS_WITH_UNREAD: (userId: string) => `/chat/users/${userId}/conversations-with-unread`,
  },

  // Notification routes
  NOTIFICATIONS: {
    BASE: '/notifications',
    GET_BY_RECIPIENT: (recipientId: string) => `/notifications/${recipientId}`,
    GET_PAGINATED: (recipientId: string) => `/notifications/${recipientId}/paginated`,
    UNREAD_COUNT: (recipientId: string) => `/notifications/${recipientId}/unread-count`,
    MARK_AS_READ: (notificationId: string) => `/notifications/${notificationId}/read`,
    MARK_AS_UNREAD: (notificationId: string) => `/notifications/${notificationId}/unread`,
    MARK_ALL_AS_READ: (recipientId: string) => `/notifications/${recipientId}/mark-all-read`,
    DELETE: (notificationId: string) => `/notifications/${notificationId}`,
  },
} as const;

