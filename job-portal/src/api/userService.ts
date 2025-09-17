import api from './axios';

export interface ResumeResponse {
  success: boolean;
  data: {
    resume: string;
  };
  message: string;
}

export const userService = {
  // Upload resume
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

  // Get current resume
  getResume: async (): Promise<ResumeResponse> => {
    const response = await api.get<ResumeResponse>('/profile/resume');
    return response.data;
  },

  // Update resume
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

  // Delete resume
  deleteResume: async (): Promise<ResumeResponse> => {
    const response = await api.delete<ResumeResponse>('/profile/resume');
    return response.data;
  },
};