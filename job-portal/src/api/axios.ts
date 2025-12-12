import axios from 'axios';
import { ROUTES } from '../constants/routes';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  withCredentials: true,
});

const getAccessToken = (): string | null => {
  const cookies = document.cookie.split(';');
  const role = localStorage.getItem('role');
  
  let cookieName = 'accessToken';
  if (role === 'admin') {
    cookieName = 'adminAccessToken';
  } else if (role === 'company') {
    cookieName = 'companyAccessToken';
  }
  
  // First try the role-specific cookie
  let tokenCookie = cookies.find(cookie => cookie.trim().startsWith(`${cookieName}=`));
  
  // If not found and role is jobseeker, also check for 'token' cookie (used by Google auth)
  if (!tokenCookie && role === 'jobseeker') {
    tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
  }
  
  return tokenCookie ? tokenCookie.split('=')[1] : null;
};

api.interceptors.request.use(
  (config) => {
    config.headers = { ...(config.headers || {}), 'Content-Type': 'application/json' };
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[axios] Token found, Authorization header set for:', config.url);
    } else {
      console.warn('[axios] No token found for request:', config.url);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if user is blocked (403 with "Account blocked" message)
    const isBlockedUser = error.response?.status === 403 && 
                         (error.response?.data?.error === 'Account blocked' || 
                          error.response?.data?.message === 'Account blocked' ||
                          error.response?.data?.data?.error === 'Account blocked');
    
    if (isBlockedUser) {
      // Clear user data and redirect to blocked page
      localStorage.removeItem('role');
      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      window.location.href = ROUTES.BLOCKED;
      return Promise.reject(error);
    }
    
    // Suppress console errors for 404s on company search endpoints (expected behavior)
    // These are handled gracefully in companyService
    const isCompanySearch404 = error.response?.status === 404 && 
                               originalRequest.url?.includes('/company/search');
    
    if (isCompanySearch404) {
      // Return error without logging to console - this is expected when company doesn't exist
      return Promise.reject(error);
    }
    
    if ((error.response?.status === 401 || error.response?.status === 403) && !originalRequest._retry) {
      originalRequest._retry = true;
      const isAuthEndpoint = originalRequest.url?.includes('/login') || 
                            originalRequest.url?.includes('/register') ||
                            originalRequest.url?.includes('/refresh-token');
      
      if (isAuthEndpoint) {
        return Promise.reject(error);
      }
      
      try {
        // Get current role to determine which refresh endpoint to call
        const role = localStorage.getItem('role');
        let refreshEndpoint = '/api/users/refresh-token'; // Default for jobseeker
        
        if (role === 'company') {
          refreshEndpoint = '/api/company/refresh-token';
        } else if (role === 'admin') {
          refreshEndpoint = '/api/users/admin/refresh-token';
          console.log('🔄 Admin token expired, attempting to refresh...');
        }
        
        console.log('🔄 Calling refresh endpoint:', refreshEndpoint);
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:4000'}${refreshEndpoint}`,
          {},
          { withCredentials: true }
        );
        if (response.status === 200) {
          console.log('✅ Token refresh successful, retrying original request');
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        localStorage.removeItem('role');
        window.location.href = ROUTES.LOGIN;
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;