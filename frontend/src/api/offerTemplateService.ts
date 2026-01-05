import api from './axios';

export interface CompanyOfferTemplate {
  id: string;
  companyId: string;
  logoUrl: string | null;
  signatureUrl: string | null;
  brandColor: string | null;
  fontFamily: string | null;
  headerText: string | null;
  introText: string | null;
  closingText: string | null;
  footerText: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTemplateInput {
  brandColor?: string | null;
  fontFamily?: string | null;
  headerText?: string | null;
  introText?: string | null;
  closingText?: string | null;
  footerText?: string | null;
}

export interface PreviewOfferData {
  jobTitle: string;
  ctc: number;
  joiningDate: string;
  location: string;
  offerMessage?: string;
  offerExpiryDate: string;
  candidateName: string;
  companyName: string;
}

export const offerTemplateService = {
  getTemplate: async (): Promise<CompanyOfferTemplate | null> => {
    const response = await api.get<{ success: boolean; data: CompanyOfferTemplate }>('/offers/template');
    return response.data.data || null;
  },

  updateTemplate: async (data: UpdateTemplateInput): Promise<CompanyOfferTemplate> => {
    const response = await api.post<{ success: boolean; data: CompanyOfferTemplate }>('/offers/template', data);
    return response.data.data;
  },

  uploadLogo: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post<{ success: boolean; data: { logoUrl: string } }>('/offers/template/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data.logoUrl;
  },

  uploadSignature: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('signature', file);
    const response = await api.post<{ success: boolean; data: { signatureUrl: string } }>('/offers/template/signature', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data.signatureUrl;
  },

  previewTemplate: async (sampleData: PreviewOfferData): Promise<Blob> => {
    const response = await api.post('/offers/template/preview', sampleData, {
      responseType: 'blob',
    });
    return response.data as Blob;
  },
};

