import api from './axios';

export interface AtsAnalysisResult {
  score: number;
  matchingKeywords: string[];
  missingKeywords: string[];
  analysis: string;
  recommendations: string[];
}

// Helper function to convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const atsService = {
  analyzeResume: async (file: File, jobDescription: string): Promise<AtsAnalysisResult> => {
    // Convert file to base64 and send as JSON
    const resumeBase64 = await fileToBase64(file);
    
    const response = await api.post<{ success: boolean; data: AtsAnalysisResult }>('/ats/analyze', {
      resumeBase64,
      fileName: file.name,
      jobDescription,
    });

    return response.data.data;
  },

  analyzeApplicationResume: async (applicationId: string): Promise<AtsAnalysisResult> => {
    const response = await api.post<{ success: boolean; data: AtsAnalysisResult }>(
      `/ats/analyze-application/${applicationId}`
    );

    return response.data.data;
  },
};
