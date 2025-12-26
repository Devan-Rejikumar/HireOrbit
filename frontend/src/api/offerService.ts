import api from './axios';

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
  pdfUrl?: string;
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

export const offerService = {
  createOffer: async (applicationId: string, offerData: CreateOfferInput): Promise<OfferResponse> => {
    const response = await api.post<OfferResponse>(
      `/applications/${applicationId}/offer`,
      offerData
    );
    return response.data;
  },

  getUserOffers: async (page: number = 1, limit: number = 10, status?: OfferStatus): Promise<PaginatedOfferResponse> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);

    const response = await api.get<PaginatedOfferResponse>(
      `/offers/users/me/offers?${params.toString()}`
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
      `/offers/companies/me/offers?${params.toString()}`
    );
    return response.data;
  },

  getOfferById: async (offerId: string): Promise<OfferResponse> => {
    const response = await api.get<OfferResponse>(`/offers/${offerId}`);
    return response.data;
  },

  acceptOffer: async (offerId: string): Promise<OfferResponse> => {
    const response = await api.post<OfferResponse>(`/offers/${offerId}/accept`);
    return response.data;
  },

  rejectOffer: async (offerId: string): Promise<OfferResponse> => {
    const response = await api.post<OfferResponse>(`/offers/${offerId}/reject`);
    return response.data;
  },

  downloadOfferPdf: async (offerId: string): Promise<Blob> => {
    const response = await api.get(`/offers/${offerId}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

