// Debug script to identify the route matching issue
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
    console.log('🔍 Checking path:', JSON.stringify(path));
    console.log('🔍 Available public routes:', ROUTES.public.map(r => JSON.stringify(r)));
    
    const result = ROUTES.public.some(route => {
        console.log(`  📍 Checking "${path}" against "${route}"`);
        // Check exact match first
        if (path === route) {
            console.log('  ✅ Exact match found!');
            return true;
        }
        // Check if path starts with the route (for wildcard routes)
        if (route.includes("*")) {
            const baseRoute = route.replace("/*", "");
            const startsWith = path.startsWith(baseRoute);
            console.log(`  🔄 Wildcard: "${baseRoute}" startsWith: ${startsWith}`);
            return startsWith;
        }
        console.log('  ❌ No match');
        return false;
    });
    
    console.log('🔍 Final result for', JSON.stringify(path), ':', result);
    return result;
};

// Test the exact path that's failing
console.log('🧪 Testing the exact failing path:');
console.log('Result:', isPublicRoute('/api/users/login'));

// Test potential variations
console.log('\n🧪 Testing potential variations:');
console.log('With trailing slash:', isPublicRoute('/api/users/login/'));
console.log('Without leading slash:', isPublicRoute('api/users/login'));
console.log('With query params:', isPublicRoute('/api/users/login?test=1'));
