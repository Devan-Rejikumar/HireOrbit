import api from './axios';
import { ENV } from '../config/env';

export interface ResumeResponse {
  success: boolean;
  data: {
    resume: string;
  };
  message: string;
}

export const userService = {
  uploadResume: async (file: File): Promise<ResumeResponse> => {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    
    const response = await api.post<ResumeResponse>('/profile/resume', {
      resume: base64,
    });
    return response.data;
  },

  getResume: async (): Promise<ResumeResponse> => {
    const response = await api.get<ResumeResponse>('/profile/resume');
    return response.data;
  },

  updateResume: async (file: File): Promise<ResumeResponse> => {

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    
    const response = await api.put<ResumeResponse>('/profile/resume', {
      resume: base64,
    });
    return response.data;
  },

  deleteResume: async (): Promise<ResumeResponse> => {
    const response = await api.delete<ResumeResponse>('/profile/resume');
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await fetch(`${ENV.API_BASE_URL}/users/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', 
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });
  
  
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  
    const data = await response.json();
    return data;
  },

  sendOTP: async (email: string) => {
    const response = await api.post('/users/generate-otp', { email });
    return response.data;
  },

  verifyOTP: async (email: string, otp: number) => {
    const response = await api.post('/users/verify-otp', { email, otp: otp.toString() });
    return response.data;
  },
  sendVerificationOTP: async (email: string) => {
    const response = await api.post('/users/generate-verification-otp', { email });
    return response.data;
  },
};
