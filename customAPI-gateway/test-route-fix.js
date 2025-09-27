// Test the fixed route matching logic
const ROUTES = {
    public: [
        '/api/users/login',
        '/api/users/register',
        '/api/users/refresh-token',
        '/api/company/login',
        '/api/company/register',
        '/api/company/refresh-token',
    ]
};

const isPublicRoute = (path) => {
    console.log('🔍 Checking path:', JSON.stringify(path));
    
    // Clean the path: remove query parameters and trailing slashes
    const cleanPath = path.split('?')[0].replace(/\/+$/, '');
    console.log('🔍 Cleaned path:', JSON.stringify(cleanPath));
    
    const result = ROUTES.public.some(route => {
        if (cleanPath === route) {
            console.log('  ✅ Exact match found!');
            return true;
        }
        if (route.includes("*")) {
            const baseRoute = route.replace("/*", "");
            return cleanPath.startsWith(baseRoute);
        }
        return false;
    });
    
    console.log('🔍 Final result:', result);
    return result;
};

console.log('🧪 Testing fixed route matching:');
console.log('1. Normal path:', isPublicRoute('/api/users/login'));
console.log('2. With trailing slash:', isPublicRoute('/api/users/login/'));
console.log('3. With query params:', isPublicRoute('/api/users/login?test=1'));
console.log('4. With both:', isPublicRoute('/api/users/login/?test=1'));
