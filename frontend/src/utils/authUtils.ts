// Utility functions for authentication and token handling

export const getTokenFromCookie = () => {
  const cookies = document.cookie.split(';');
  
  // All roles now use unified accessToken cookie
  const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken='));
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
      // Silently handle error
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
