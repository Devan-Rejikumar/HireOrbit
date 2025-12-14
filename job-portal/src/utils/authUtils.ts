// Utility functions for authentication and token handling

export const getTokenFromCookie = () => {
  const cookies = document.cookie.split(';');
  let role = localStorage.getItem('role');
  
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
  
  let cookieName = 'accessToken';
  if (role === 'admin') {
    cookieName = 'adminAccessToken';
  } else if (role === 'company') {
    cookieName = 'companyAccessToken';
  }
  
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith(`${cookieName}=`));
  return tokenCookie ? tokenCookie.split('=')[1] : null;
};

export const getUserInfoFromToken = () => {
  const token = getTokenFromCookie();
  const role = localStorage.getItem('role') || 'jobseeker';
  
  let userId = '';
  let userEmail = '';
  
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.userId || payload.id || '';
      userEmail = payload.email || '';
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }

  return {
    userId,
    userEmail,
    role,
  };
};

export const getAuthHeaders = () => {
  const { userId, userEmail, role } = getUserInfoFromToken();
  
  return {
    'x-user-id': userId,
    'x-user-email': userEmail,
    'x-user-role': role,
  };
};
