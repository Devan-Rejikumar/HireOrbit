export const ROUTES = {
    public: [
        '/api/users/login',
        '/api/users/register',
        '/api/users/refresh-token',
        '/api/company/login',
        '/api/company/register',
        '/api/company/refresh-token',
        ],
        protected: [
            '/api/users/*',
            '/api/company/*',
            '/api/jobs/*',
            '/api/applications/*'
        ],
        health: [
            '/health',
            '/metrics'
        ]

};