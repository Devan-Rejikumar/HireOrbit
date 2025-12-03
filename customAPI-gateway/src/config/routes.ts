// Service route path constants
export const SERVICE_ROUTES = {
    USERS: '/api/users',
    COMPANY: '/api/company',
    JOBS: '/api/jobs',
    APPLICATIONS: '/api/applications',
    INTERVIEWS: '/api/interviews',
    NOTIFICATIONS: '/api/notifications',
    CHAT: '/api/chat',
    SUBSCRIPTIONS: '/api/subscriptions'
} as const;

export const ROUTES = {
    authentication: [
        '/api/users/login',
        '/api/users/register', 
        '/api/users/refresh-token',
        '/api/users/admin/login',
        '/api/users/admin/refresh-token',
        '/api/company/login',
        '/api/company/register',
        '/api/company/refresh-token'
    ],

    protected: [
        '/api/users/profile',
        '/api/users/update',
        '/api/users/me',
        '/api/users/logout',
        '/api/users/change-password',
        '/api/users/update-name',
        '/api/profile/full',
        '/api/profile',
        '/api/company/profile', 
        '/api/company/update',
        '/api/jobs/create',
        '/api/jobs/update',
        '/api/jobs/delete',
        '/api/jobs/company',
        '/api/jobs/admin/reported', 
        '/api/jobs/:jobId/report',
        '/api/applications/create',
        '/api/applications/update',
        '/api/applications/delete',
        '/api/applications/company/applications',
        '/api/applications/company/statistics',
        '/api/interviews',
        '/api/company/admin/industries',
        '/api/subscriptions', 
        '/api/subscriptions/status', 
        '/api/subscriptions/:subscriptionId/cancel', 
        '/api/subscriptions/:subscriptionId/upgrade', 
        '/api/subscriptions/limits/job-posting', 
        '/api/subscriptions/features/:featureName'
    ],
    
    public: [
        '/api/jobs', 
        '/api/jobs/list',
        '/api/jobs/search',
        '/api/jobs/details',
        '/api/jobs/suggestions',
        '/api/company/list',
        '/api/company/details',
        '/api/users/generate-otp',
        '/api/users/verify-otp',
        '/api/users/resend-otp',
        '/api/users/forgot-password',
        '/api/users/verify-password-reset-otp',
        '/api/users/reset-password',
        '/api/users/google-auth',
        '/api/company/generate-otp',
        '/api/company/verify-otp',
        '/api/company/forgot-password',
        '/api/company/reset-password',
        '/api/industries',
        '/api/subscriptions/plans',
    ]
};