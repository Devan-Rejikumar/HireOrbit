export const ROUTES = {
    authentication: [
        '/api/users/login',
        '/api/users/register', 
        '/api/users/refresh-token',
        '/api/users/admin/login',
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
        '/api/applications/create',
        '/api/applications/update',
        '/api/applications/delete',
        '/api/applications/company/applications',
        '/api/applications/company/statistics'
    ],
    
    public: [
        // Job listing routes (should be public for browsing)
        '/api/jobs', // This covers /api/jobs and /api/jobs/{id} via pattern matching
        '/api/jobs/list',
        '/api/jobs/search',
        '/api/jobs/details',
        '/api/jobs/suggestions',
        '/api/jobs/company',
        '/api/company/list',
        '/api/company/details',
        // OTP and password reset routes (should be public)
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
        '/api/company/reset-password'
    ]
};