import { OfferStatus } from '../../enums/OfferStatus';

export interface OfferResponse {
  id: string;
  applicationId: string;
  userId: string;
  companyId: string;
  jobTitle: string;
  ctc: number;
  joiningDate: Date;
  location: string;
  offerMessage?: string;
  offerExpiryDate: Date;
  status: OfferStatus;
  pdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OfferDetailsResponse extends OfferResponse {
  candidateName?: string;
  candidateEmail?: string;
  companyName?: string;
}

export interface PaginatedOfferResponse {
  offers: OfferResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

