import api from './axios';
import { API_ROUTES } from '../constants/apiRoutes';

export interface ATSAnalysisResponse {
  score: number;
  improvements: string[];
  missingKeywords: string[];
  strengths: string[];
  keywordMatch?: number;
}

export const atsService = {
  analyzeResume: async (
    resumeFile: File,
    jobDescription: string,
  ): Promise<{ data: ATSAnalysisResponse; message: string }> => {
    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('jobDescription', jobDescription);
    const response = await api.post<{
      success: boolean;
      data: ATSAnalysisResponse;
      message: string;
    }>(API_ROUTES.APPLICATIONS.ATS.ANALYZE, formData);

    return {
      data: response.data.data,
      message: response.data.message || '',
    };
  },
};

