import api from './axios';

export interface CompanyReapplication {
  companyId: string;
  reason: string;
  additionalInfo?: string;
  submittedAt: string;
}

export interface CompanyProfile {
  id: string;
  name: string;
  industry: string;
  companySize: string;
  website: string;
  description: string;
  logo: string;
  foundedYear: string;
  location: string;
  email: string;
  phone: string;
  socialMedia: {
    linkedin: string;
  };
}

export const companyService = {
  getReapplicationStatus: async (companyId: string) => {
    const response = await api.get<{
      data: { status: string };
    }>(`http://localhost:3002/api/companies/${companyId}/reapplication-status`);
    return response.data;
  },
  
  submitReapplication: async (reapplicationData: {
    companyId: string;
    reason: string;
    updatedInfo: Record<string, string>;
    documents: File[];
  }) => {
    const formData = new FormData();
    formData.append('reason', reapplicationData.reason);
    formData.append('updatedInfo', JSON.stringify(reapplicationData.updatedInfo));
    
    reapplicationData.documents.forEach((doc, index) => {
      formData.append(`document_${index}`, doc);
    });

    const response = await api.post<{
      data: CompanyReapplication;
    }>(`http://localhost:3002/api/companies/${reapplicationData.companyId}/reapply`, formData);
    return response.data;
  },

  searchCompanyByName: async (companyName: string) => {
    try {
      const response = await api.get<{
        success: boolean;
        data: { company: CompanyProfile };
        message: string;
      }>(`/company/search?name=${encodeURIComponent(companyName)}`);
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return { success: false, data: null, message: 'Company not found' };
      }
      throw error;
    }
  }
};