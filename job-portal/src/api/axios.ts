import axios from 'axios';
import { ROUTES } from '../constants/routes';
import { ENV } from '../config/env';
import { HTTP_STATUS } from '../constants/statusCodes';
import { MESSAGES } from '../constants/messages';

const api = axios.create({
  baseURL: ENV.API_BASE_URL,
  withCredentials: true,
});

import { toast } from 'react-hot-toast';

// Response caching for GET requests
interface CacheEntry {
  data: unknown;
  timestamp: number;
}

interface ExtendedAxiosRequestConfig extends axios.InternalAxiosRequestConfig {
  __CACHED__?: boolean;
  __CACHED_DATA__?: unknown;
}

const responseCache = new Map<string, CacheEntry>();
const CACHE_TTL = 30000; // 30 seconds cache

const getCacheKey = (config: axios.InternalAxiosRequestConfig): string => {
  const url = config.url || '';
  const params = config.params ? JSON.stringify(config.params) : '';
  return `${config.method?.toUpperCase() || 'GET'}_${url}_${params}`;
};

const isCacheable = (config: axios.InternalAxiosRequestConfig): boolean => {
  // Only cache GET requests
  return (config.method?.toLowerCase() === 'get' || !config.method);
};

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
  (config: axios.InternalAxiosRequestConfig) => {
    // Ensure headers object exists
    config.headers = config.headers || {};
    
    // Only set Content-Type to JSON if not already specified (preserves multipart/form-data for file uploads)
    if (!config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json';
    }
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[axios] Token found, Authorization header set for:', config.url);
    } else {
      console.warn('[axios] No token found for request:', config.url);
    }
    
    // Check cache for GET requests
    if (isCacheable(config)) {
      const cacheKey = getCacheKey(config);
      const cached = responseCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('[axios] Cache hit for:', config.url);
        // Mark config to indicate cached response
        const extendedConfig = config as ExtendedAxiosRequestConfig;
        extendedConfig.__CACHED__ = true;
        extendedConfig.__CACHED_DATA__ = cached.data;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response: axios.AxiosResponse) => {
    const config = response.config as ExtendedAxiosRequestConfig;
    
    // Handle cached responses
    if (config.__CACHED__ && config.__CACHED_DATA__ !== undefined) {
      return {
        ...response,
        data: config.__CACHED_DATA__,
      };
    }
    
    // Cache successful GET responses
    if (isCacheable(response.config) && response.status === 200) {
      const cacheKey = getCacheKey(response.config);
      responseCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      });
      
      // Clean old cache entries periodically (keep cache size manageable)
      if (responseCache.size > 100) {
        const now = Date.now();
        for (const [key, value] of responseCache.entries()) {
          if (now - value.timestamp > CACHE_TTL) {
            responseCache.delete(key);
          }
        }
      }
    }
    
    return response;
  },
  async (error: axios.AxiosError) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig | undefined;
    
    // Check if user is blocked (403 with "Account blocked" message)
    const isBlockedUser = error.response?.status === HTTP_STATUS.FORBIDDEN && 
                         (error.response?.data?.error === 'Account blocked' || 
                          error.response?.data?.message === 'Account blocked' ||
                          error.response?.data?.data?.error === 'Account blocked');
    
    if (isBlockedUser) {
      toast.error('Your account has been blocked.');
      // Clear user data and redirect to blocked page
      localStorage.removeItem('role');
      // Clear all cookies
      document.cookie.split(';').forEach((c) => {
        document.cookie = c
          .replace(/^ +/, '')
          .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
      });
      window.location.href = ROUTES.BLOCKED;
      return Promise.reject(error);
    }
    
    // Suppress console errors for 404s on company search endpoints (expected behavior)
    // These are handled gracefully in companyService
    const isCompanySearch404 = error.response?.status === HTTP_STATUS.NOT_FOUND && 
                               originalRequest?.url?.includes('/company/search');
    
    if (isCompanySearch404) {
      // Return error without logging to console - this is expected when company doesn't exist
      return Promise.reject(error);
    }
    
    if ((error.response?.status === HTTP_STATUS.UNAUTHORIZED || error.response?.status === HTTP_STATUS.FORBIDDEN) && originalRequest && !originalRequest._retry) {
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
        const baseUrl = ENV.API_BASE_URL.replace('/api', '');
        const response = await axios.post(
          `${baseUrl}${refreshEndpoint}`,
          {},
          { withCredentials: true },
        );
        if (response.status === HTTP_STATUS.OK) {
          console.log('✅ Token refresh successful, retrying original request');
          return api(originalRequest);
        }
      } catch (refreshError: unknown) {
        console.error('❌ Token refresh failed:', refreshError);
        localStorage.removeItem('role');
        window.location.href = ROUTES.LOGIN;
      }
    }
    
    
    if (error.response) {
      if (error.response.status >= 500) {
        toast.error('Server error. Please try again later.');
      }
    } else if (error.request) {
      toast.error('Network error. Please check your internet connection.');
    }

    return Promise.reject(error);
  },
);

export default api;