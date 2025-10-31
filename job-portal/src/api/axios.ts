
import axios from 'axios';

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
  
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith(`${cookieName}=`));
  return tokenCookie ? tokenCookie.split('=')[1] : null;
};

api.interceptors.request.use(
  (config) => {
    config.headers = { ...(config.headers || {}), 'Content-Type': 'application/json' };
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
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
        }
        
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:4000'}${refreshEndpoint}`,
          {},
          { withCredentials: true }
        );
        if (response.status === 200) {
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('role');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;