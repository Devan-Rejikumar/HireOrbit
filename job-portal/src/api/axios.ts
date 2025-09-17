import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  withCredentials: true,
});


api.interceptors.request.use(
  (config) => {
    // Ensure correct Content-Type handling
    if (config.data instanceof FormData) {
      // Let the browser set multipart boundary; remove any preset header
      if (config.headers) {
        delete (config.headers as any)['Content-Type'];
      }
    } else {
      // Default JSON Content-Type for non-FormData requests
      config.headers = { ...(config.headers || {}), 'Content-Type': 'application/json' };
    }
    console.log('🚀 Request:', {
      method: config.method,
      url: config.url,
      withCredentials: config.withCredentials
    });
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('✅ Response received:', {
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

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !(originalRequest as any)._retry) {
      console.log('🔄 Access token expired, attempting refresh...');
      (originalRequest as any)._retry = true;

      try {
        // Make refresh token request based on user role
        const baseURL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:4000';
        const role = localStorage.getItem('role');
        const refreshUrl = role === 'company' 
          ? `${baseURL}/api/company/refresh-token`
          : `${baseURL}/api/users/refresh-token`;
        console.log('🔄 Calling refresh token endpoint for role:', role);
        console.log('🔄 Available cookies:', document.cookie);
        
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


api.interceptors.request.use(request => {
  console.log('🔍 Starting Request:', request);
  return request;
});

export default api;