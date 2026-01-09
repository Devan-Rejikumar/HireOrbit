import api from './axios';
import { ENV } from '../config/env';
import { API_ROUTES } from '../constants/apiRoutes';

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
    
    const response = await api.post<ResumeResponse>(API_ROUTES.PROFILE.RESUME.UPLOAD, {
      resume: base64,
    });
    return response.data;
  },

  getResume: async (): Promise<ResumeResponse> => {
    const response = await api.get<ResumeResponse>(API_ROUTES.PROFILE.RESUME.GET);
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
    
    const response = await api.put<ResumeResponse>(API_ROUTES.PROFILE.RESUME.UPDATE, {
      resume: base64,
    });
    return response.data;
  },

  deleteResume: async (): Promise<ResumeResponse> => {
    const response = await api.delete<ResumeResponse>(API_ROUTES.PROFILE.RESUME.DELETE);
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await fetch(`${ENV.API_BASE_URL}${API_ROUTES.USERS.CHANGE_PASSWORD}`, {
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
    const response = await api.post(API_ROUTES.USERS.GENERATE_OTP, { email });
    return response.data;
  },

  verifyOTP: async (email: string, otp: number) => {
    const response = await api.post(API_ROUTES.USERS.VERIFY_OTP, { email, otp: otp.toString() });
    return response.data;
  },
  sendVerificationOTP: async (email: string) => {
    const response = await api.post(API_ROUTES.USERS.GENERATE_VERIFICATION_OTP, { email });
    return response.data;
  },
};
