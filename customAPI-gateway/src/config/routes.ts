export const ROUTES = {
    authentication: [
        '/api/users/login',
        '/api/users/register', 
        '/api/users/refresh-token',
        '/api/company/login',
        '/api/company/register',
        '/api/company/refresh-token'
    ],

    protected: [
        '/api/users/profile',
        '/api/users/update',
        '/api/company/profile', 
        '/api/company/update',
        '/api/jobs/create',
        '/api/jobs/update',
        '/api/jobs/delete',
        '/api/applications/create',
        '/api/applications/update',
        '/api/applications/delete'
    ],
    
    public: [
        '/api/jobs/list',
        '/api/jobs/search',
        '/api/jobs/details',
        '/api/company/list',
        '/api/company/details'
    ]
};