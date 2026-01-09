import api from './axios';
import { API_ROUTES } from '../constants/apiRoutes';

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
    const response = await api.get<{ success: boolean; data: CompanyOfferTemplate }>(API_ROUTES.OFFERS.TEMPLATE.BASE);
    return response.data.data || null;
  },

  updateTemplate: async (data: UpdateTemplateInput): Promise<CompanyOfferTemplate> => {
    const response = await api.post<{ success: boolean; data: CompanyOfferTemplate }>(API_ROUTES.OFFERS.TEMPLATE.BASE, data);
    return response.data.data;
  },

  uploadLogo: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post<{ success: boolean; data: { logoUrl: string } }>(API_ROUTES.OFFERS.TEMPLATE.LOGO, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data.logoUrl;
  },

  uploadSignature: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('signature', file);
    const response = await api.post<{ success: boolean; data: { signatureUrl: string } }>(API_ROUTES.OFFERS.TEMPLATE.SIGNATURE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data.signatureUrl;
  },

  previewTemplate: async (sampleData: PreviewOfferData): Promise<Blob> => {
    const response = await api.post(API_ROUTES.OFFERS.TEMPLATE.PREVIEW, sampleData, {
      responseType: 'blob',
    });
    return response.data as Blob;
  },
};

