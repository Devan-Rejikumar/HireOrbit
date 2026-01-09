import api from './axios';
import { API_ROUTES } from '../constants/apiRoutes';

export interface CloudinaryUploadCredentials {
  uploadUrl: string;
  publicId: string;
  timestamp: number;
  signature: string;
  apiKey: string;
}

export type OfferStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface Offer {
  id: string;
  applicationId: string;
  userId: string;
  companyId: string;
  jobTitle: string;
  ctc: number;
  joiningDate: string;
  location: string;
  offerMessage?: string;
  offerExpiryDate: string;
  status: OfferStatus;
  pdfPublicId?: string;
  createdAt: string;
  updatedAt: string;
  candidateName?: string;
  candidateEmail?: string;
  companyName?: string;
}

export interface CreateOfferInput {
  jobTitle: string;
  ctc: number;
  joiningDate: string; // ISO date string
  location: string;
  offerMessage?: string;
  offerExpiryDate: string; // ISO date string
}

export interface OfferResponse {
  success: boolean;
  data: Offer;
  message: string;
}

export interface PaginatedOfferResponse {
  success: boolean;
  data: {
    offers: Offer[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
  message: string;
}

export interface UploadUrlResponse {
  success: boolean;
  data: {
    uploadUrl: string;
    publicId: string;
    timestamp: number;
    signature: string;
    apiKey: string;
  };
  message: string;
}

export interface AttachPdfResponse {
  success: boolean;
  data: {
    pdfPublicId: string;
  };
  message: string;
}

export const offerService = {
  createOffer: async (applicationId: string, offerData: CreateOfferInput): Promise<OfferResponse> => {
    const response = await api.post<OfferResponse>(
      API_ROUTES.APPLICATIONS.OFFER(applicationId),
      offerData,
    );
    return response.data;
  },

  getUserOffers: async (page: number = 1, limit: number = 10, status?: OfferStatus): Promise<PaginatedOfferResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);

    const response = await api.get<PaginatedOfferResponse>(
      `${API_ROUTES.OFFERS.USER_OFFERS}?${params.toString()}`,
    );
    return response.data;
  },

  getCompanyOffers: async (page: number = 1, limit: number = 10, status?: OfferStatus, search?: string): Promise<PaginatedOfferResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);
    if (search) params.append('search', search);

    const response = await api.get<PaginatedOfferResponse>(
      `${API_ROUTES.OFFERS.COMPANY_OFFERS}?${params.toString()}`,
    );
    return response.data;
  },

  getOfferById: async (offerId: string): Promise<OfferResponse> => {
    const response = await api.get<OfferResponse>(API_ROUTES.OFFERS.GET_BY_ID(offerId));
    return response.data;
  },

  acceptOffer: async (offerId: string): Promise<OfferResponse> => {
    const response = await api.post<OfferResponse>(API_ROUTES.OFFERS.ACCEPT(offerId));
    return response.data;
  },

  rejectOffer: async (offerId: string): Promise<OfferResponse> => {
    const response = await api.post<OfferResponse>(API_ROUTES.OFFERS.REJECT(offerId));
    return response.data;
  },

  downloadOfferPdf: async (offerId: string): Promise<{ signedUrl: string; expiresAt: string }> => {
    const response = await api.get<{
      success: boolean;
      data: { signedUrl: string; expiresAt: string };
    }>(API_ROUTES.OFFERS.DOWNLOAD_PDF(offerId));
    return response.data.data;
  },

  generateUploadUrl: async (offerId: string): Promise<UploadUrlResponse['data']> => {
    const response = await api.post<UploadUrlResponse>(
      API_ROUTES.OFFERS.UPLOAD_URL,
      { offerId }
    );
    return response.data.data;
  },

  attachOfferPdf: async (offerId: string, pdfPublicId: string): Promise<AttachPdfResponse> => {
    const response = await api.post<AttachPdfResponse>(
      API_ROUTES.OFFERS.ATTACH_PDF(offerId),
      { pdfPublicId }
    );
    return response.data;
  },

  uploadToCloudinary: async (
    file: File,
    credentials: CloudinaryUploadCredentials
  ): Promise<void> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', credentials.apiKey);
    formData.append('timestamp', credentials.timestamp.toString());
    formData.append('signature', credentials.signature);
    formData.append('public_id', credentials.publicId);
    formData.append('type', 'authenticated');
    formData.append('resource_type', 'raw');


    // ⚠️ CRITICAL: Use plain fetch WITHOUT auth headers for Cloudinary
    const response = await fetch(credentials.uploadUrl, {
      method: 'POST',
      body: formData,
      // No Authorization header!
    });

    if (!response.ok) {
      throw new Error(`Cloudinary upload failed: ${response.statusText}`);
    }
  },

  /**
   * Complete offer PDF upload flow
   * 1. Get upload credentials from backend
   * 2. Upload PDF directly to Cloudinary
   * 3. Notify backend to save public_id
   */
  uploadOfferPdf: async (offerId: string, pdfFile: File): Promise<void> => {
    try {
      // Step 1: Get signed upload credentials
      const credentials = await offerService.generateUploadUrl(offerId);

      // Step 2: Upload PDF directly to Cloudinary (NO auth headers!)
      await offerService.uploadToCloudinary(pdfFile, credentials);

      // Step 3: Notify backend to save the public_id
      const cleanPublicId = credentials.publicId.replace(/\.pdf$/i, '');
      await offerService.attachOfferPdf(offerId, cleanPublicId);

    } catch (error) {
      console.error('Offer PDF upload failed:', error);
      throw error;
    }
  },
};

