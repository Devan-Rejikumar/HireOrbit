import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  withCredentials: true,
});

// Request Interceptor: Content-Type and Logging
api.interceptors.request.use(
  (config) => {
    // Set JSON Content-Type for all requests
    config.headers = { ...(config.headers || {}), 'Content-Type': 'application/json' };
    
    // Add Authorization header with JWT token from cookie
  const getTokenFromCookie = () => {
    const cookies = document.cookie.split(';');
    let role = localStorage.getItem('role');
    
    // Auto-detect role from cookies if not set or check available tokens
    // Priority: admin > company > user
    if (!role || !document.cookie.includes(role === 'admin' ? 'adminAccessToken' : role === 'company' ? 'companyAccessToken' : 'accessToken')) {
      if (document.cookie.includes('adminAccessToken')) {
        role = 'admin';
        localStorage.setItem('role', 'admin');
      } else if (document.cookie.includes('companyAccessToken')) {
        role = 'company';
        localStorage.setItem('role', 'company');
      } else if (document.cookie.includes('accessToken')) {
        role = 'user';
        localStorage.setItem('role', 'user');
      }
    }
    
    let cookieName = 'accessToken'; // default
    if (role === 'admin') {
      cookieName = 'adminAccessToken';
    } else if (role === 'company') {
      cookieName = 'companyAccessToken';
    }
    
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith(`${cookieName}=`));
    const token = tokenCookie ? tokenCookie.split('=')[1] : null;
    
    console.log('🔑 Token detection:', {
      role,
      cookieName,
      tokenFound: !!token,
      availableCookies: document.cookie.split(';').map(c => c.trim().split('=')[0])
    });
    
    return token;
  };
    
    const token = getTokenFromCookie();
    if (token) {
      config.headers = { ...(config.headers || {}), 'Authorization': `Bearer ${token}` };
    }
    
    console.log('🚀 Request:', {
      method: config.method,
      url: config.url,
      withCredentials: config.withCredentials,
      hasAuthHeader: !!config.headers?.['Authorization']
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor: Success and Error Handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', {
      status: response.status,
      url: response.config.url,
      cookies: document.cookie
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    console.log('🔥 Error response:', {
      status: error.response?.status,
      url: originalRequest.url,
      cookies: document.cookie
    });

    // Skip token refresh for login endpoints
    const isLoginEndpoint = originalRequest.url?.includes('/login') || 
                           originalRequest.url?.includes('/register') ||
                           originalRequest.url?.includes('/admin/login');
    
    // If error is 401 and we haven't retried yet and it's not a login endpoint
    if (error.response?.status === 401 && !originalRequest._retry && !isLoginEndpoint) {
      console.log('🔄 Access token expired, attempting refresh...');
      originalRequest._retry = true;

      try {
        // Make refresh token request based on user role
        const baseURL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:4000';
        const role = localStorage.getItem('role');
        
        // Auto-detect role from cookies for refresh token
        // Priority: admin > company > user
        let userRole = role;
        if (document.cookie.includes('adminRefreshToken') || document.cookie.includes('adminAccessToken')) {
          userRole = 'admin';
          localStorage.setItem('role', 'admin');
        } else if (document.cookie.includes('companyRefreshToken') || document.cookie.includes('companyAccessToken')) {
          userRole = 'company';
          localStorage.setItem('role', 'company');
        } else if (document.cookie.includes('userRefreshToken') || document.cookie.includes('accessToken')) {
          userRole = 'user';
          localStorage.setItem('role', 'user');
        }
        
        let refreshUrl = `${baseURL}/api/users/refresh-token`; // default
        if (userRole === 'admin') {
          refreshUrl = `${baseURL}/api/users/admin/refresh-token`;
        } else if (userRole === 'company') {
          refreshUrl = `${baseURL}/api/company/refresh-token`;
        }
        
        console.log('🔄 Calling refresh token endpoint for role:', userRole);
        console.log('🔄 Available cookies:', document.cookie);
        console.log('🔄 Refresh URL:', refreshUrl);
        
        const response = await axios.post(
          refreshUrl,
          {},  
          {
            withCredentials: true,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('✨ Token refresh successful:', response.status);
        return api(originalRequest);
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);

        localStorage.removeItem('role');
        // window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;