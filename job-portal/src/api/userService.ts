import api from './axios';

export interface ResumeResponse {
  success: boolean;
  data: {
    resume: string;
  };
  message: string;
}

export const userService = {
  uploadResume: async (file: File): Promise<ResumeResponse> => {
    const formData = new FormData();
    formData.append('resume', file);
    
    const response = await api.post<ResumeResponse>('/profile/resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getResume: async (): Promise<ResumeResponse> => {
    const response = await api.get<ResumeResponse>('/profile/resume');
    return response.data;
  },

  updateResume: async (file: File): Promise<ResumeResponse> => {
    const formData = new FormData();
    formData.append('resume', file);
    
    const response = await api.put<ResumeResponse>('/profile/resume', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteResume: async (): Promise<ResumeResponse> => {
    const response = await api.delete<ResumeResponse>('/profile/resume');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
  console.log('🔍 [UserService] Calling change password API...');
  console.log('🔍 [UserService] API base URL:', api.defaults.baseURL);
  
  // Call user service directly since API gateway might not be running
  const response = await fetch('http://localhost:3000/api/users/change-password', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // This sends HttpOnly cookies
    body: JSON.stringify({
      currentPassword,
      newPassword
    })
  });
  
  console.log('🔍 [UserService] Change password response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ [UserService] Change password error:', errorText);
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  console.log('🔍 [UserService] Change password response:', data);
  return data;
},

  sendOTP: async (email: string) => {
    console.log('🔍 [UserService] Sending OTP to:', email);
    const response = await api.post('/users/generate-otp', { email });
    console.log('🔍 [UserService] Send OTP response:', response.data);
    return response.data;
  },

  verifyOTP: async (email: string, otp: number) => {
    console.log('🔍 [UserService] Verifying OTP for:', email, 'OTP:', otp);
    const response = await api.post('/users/verify-otp', { email, otp: otp.toString() });
    console.log('🔍 [UserService] Verify OTP response:', response.data);
    return response.data;
  },
  sendVerificationOTP: async (email: string) => {
  console.log('🔍 [UserService] Sending verification OTP to:', email);
  const response = await api.post('/users/generate-verification-otp', { email });
  console.log('🔍 [UserService] Send verification OTP response:', response.data);
  return response.data;
},
};