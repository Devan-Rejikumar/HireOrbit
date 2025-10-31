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
        role = 'jobseeker';
        localStorage.setItem('role', 'jobseeker');
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
    
    if (token) {
      console.log('✅ Token found:', token.substring(0, 20) + '...');
    } else {
      console.log('❌ No token found for role:', role);
      console.log('🔍 Looking for cookie:', cookieName);
      console.log('🔍 All cookies:', document.cookie);
    }
    
  return token;
};

// Function to get refresh token from cookies
const getRefreshTokenFromCookie = () => {
  const cookies = document.cookie.split(';');
  const refreshTokenCookie = cookies.find(cookie => cookie.trim().startsWith('refreshToken='));
  return refreshTokenCookie ? refreshTokenCookie.split('=')[1] : null;
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
    
    // Debug token details
    if (config.headers?.['Authorization']) {
      console.log('🔑 Token being sent:', config.headers['Authorization'].substring(0, 20) + '...');
    } else {
      console.log('❌ No Authorization header found');
      console.log('🔍 Available cookies:', document.cookie);
    }
    
    return config;
  },
  async (error) => {
    console.error('❌ Request Error:', error);
    
    // Handle 401/403 errors with token refresh
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('🔄 Token expired, attempting refresh...');
      
      try {
        const refreshToken = getRefreshTokenFromCookie();
        if (refreshToken) {
          console.log('🔄 Refresh token found, calling refresh endpoint...');
          const response = await axios.post('http://localhost:4000/api/users/refresh', {
            refreshToken: refreshToken
          });
          
          if (response.data.success) {
            console.log('🔄 Token refreshed successfully');
            // Update the access token cookie
            document.cookie = `accessToken=${response.data.data.accessToken}; path=/; domain=localhost; max-age=${2*60*60}`;
            
            // Retry the original request
            const originalRequest = error.config;
            originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
            return axios(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('🔄 Token refresh failed:', refreshError);
        // Redirect to login if refresh fails
        window.location.href = '/login';
      }
    }
    
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