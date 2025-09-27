const ROUTES = {
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
    ]
};

const isPublicRoute = (path) => {
    console.log('🔍 Checking path:', path);
    return ROUTES.public.some(route => {
        console.log('  📍 Against route:', route);
        // Check exact match first
        if (path === route) {
            console.log('  ✅ Exact match found!');
            return true;
        }
        // Check if path starts with the route (for wildcard routes)
        if (route.includes("*")) {
            const baseRoute = route.replace("/*", "");
            console.log('  🔄 Wildcard route:', baseRoute, 'starts with:', path.startsWith(baseRoute));
            return path.startsWith(baseRoute);
        }
        console.log('  ❌ No match');
        return false;
    });
};

console.log('🧪 Testing routes:');
console.log('1. /api/users/login:', isPublicRoute('/api/users/login'));
console.log('2. /api/users/register:', isPublicRoute('/api/users/register'));
console.log('3. /api/users/profile:', isPublicRoute('/api/users/profile'));
console.log('4. /api/company/login:', isPublicRoute('/api/company/login'));
