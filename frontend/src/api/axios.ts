import axios from 'axios';
import { ROUTES } from '../constants/routes';
import { ENV } from '../config/env';
import { HTTP_STATUS } from '../constants/statusCodes';
import { MESSAGES } from '../constants/messages';

const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  withCredentials: true,
});

const getAccessToken = (): string | null => {
  const cookies = document.cookie.split(';');
  
  // All roles now use unified accessToken cookie
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken='));
  
  // Fallback to 'token' cookie for backward compatibility (if needed)
  if (!tokenCookie) {
    const fallbackToken = cookies.find(cookie => cookie.trim().startsWith('token='));
    return fallbackToken ? fallbackToken.split('=')[1] : null;
  }
  
  return tokenCookie ? tokenCookie.split('=')[1] : null;
};

api.interceptors.request.use(
  (config) => {
    // Don't set Content-Type for FormData - axios will set it automatically with boundary
    if (!(config.data instanceof FormData)) {
      config.headers = config.headers ?? {};
      config.headers['Content-Type'] = 'application/json';
    }
    
    const token = getAccessToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
      
    } else {
      // Token not found - request will proceed without auth header
    }
    
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    console.log('[Axios Interceptor] Error caught:', {
      url: originalRequest?.url,
      status: error.response?.status,
      data: error.response?.data
    });
  
    const isBlockedUser = error.response?.status === HTTP_STATUS.FORBIDDEN && 
                         (error.response?.data?.error === 'Account blocked' || 
                          error.response?.data?.message === 'Account blocked' ||
                          error.response?.data?.data?.error === 'Account blocked');
    
    if (isBlockedUser) {
      console.log('[Axios Interceptor] User is blocked, clearing auth');
      localStorage.removeItem('role');
      document.cookie.split(';').forEach((c) => {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
      });
      window.location.href = ROUTES.BLOCKED;
      return Promise.reject(error);
    }

    const isCompanySearch404 = error.response?.status === HTTP_STATUS.NOT_FOUND && 
                               originalRequest.url?.includes('/company/search');
    
    if (isCompanySearch404) {
      return Promise.reject(error);
    }
    
    // Handle 429 Too Many Requests - show modal
    if (error.response?.status === HTTP_STATUS.TOO_MANY_REQUESTS) {
      const retryAfter = error.response.headers['retry-after'] || 
                        error.response.data?.retryAfter || 
                        60; // Default 60 seconds
      
      // Dispatch custom event to show rate limit modal
      window.dispatchEvent(new CustomEvent('rate-limit-exceeded', {
        detail: { retryAfter: parseInt(retryAfter.toString(), 10) }
      }));
      
      // Don't retry automatically - let user wait
      return Promise.reject(error);
    }
    
    if ((error.response?.status === HTTP_STATUS.UNAUTHORIZED || error.response?.status === HTTP_STATUS.FORBIDDEN) && !originalRequest._retry) {
      originalRequest._retry = true;
      const isAuthEndpoint = originalRequest.url?.includes('/login') || 
                            originalRequest.url?.includes('/register') ||
                            originalRequest.url?.includes('/refresh-token');
      
      console.log('[Axios Interceptor] Auth error, isAuthEndpoint:', isAuthEndpoint);
      
      if (isAuthEndpoint) {
        console.log('[Axios Interceptor] Skipping refresh for auth endpoint');
        return Promise.reject(error);
      }
      
      try {
        const role = localStorage.getItem('role');
        let refreshEndpoint = '/api/users/refresh-token'; 
        
        if (role === 'company') {
          refreshEndpoint = '/api/company/refresh-token';
        } else if (role === 'admin') {
          refreshEndpoint = '/api/users/admin/refresh-token';
        }
        
        console.log('[Axios Interceptor] Attempting token refresh via interceptor');
        const baseUrl = ENV.API_BASE_URL.replace(/\/api$/, '');
        const response = await axios.post(
          `${baseUrl}${refreshEndpoint}`,
          {},
          { withCredentials: true },
        );
        if (response.status === HTTP_STATUS.OK) {
          console.log('[Axios Interceptor] Token refresh successful, retrying original request');
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Only logout if refresh token is truly invalid (401/403)
        // Don't logout on network errors or temporary failures
        const isAxiosRefreshError = refreshError && typeof refreshError === 'object' && 'response' in refreshError;
        const axiosRefreshError = isAxiosRefreshError 
          ? (refreshError as { response?: { status?: number } }) 
          : null;
        
        const isAuthFailure = axiosRefreshError?.response?.status === HTTP_STATUS.UNAUTHORIZED || 
                              axiosRefreshError?.response?.status === HTTP_STATUS.FORBIDDEN;
        
        console.log('[Axios Interceptor] Refresh failed in interceptor:', {
          status: axiosRefreshError?.response?.status,
          isAuthFailure
        });
        
        if (isAuthFailure) {
          // Refresh token is invalid/expired - logout
          console.log('[Axios Interceptor] Auth failure, clearing localStorage.role and redirecting');
          localStorage.removeItem('role');
          window.location.href = ROUTES.LOGIN;
        }
        // For network errors, just reject - user stays logged in, can retry
      }
    }
    
    return Promise.reject(error);
  },
);

export default api;