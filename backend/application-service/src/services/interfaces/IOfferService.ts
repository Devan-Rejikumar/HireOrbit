import { OfferResponse, OfferDetailsResponse, PaginatedOfferResponse } from '../../dto/responses/offer.response';
import { CreateOfferInput, GetOffersQueryInput } from '../../dto/schemas/offer.schema';

export interface IOfferService {
  createOffer(applicationId: string, companyId: string, data: CreateOfferInput): Promise<OfferResponse>;
  getUserOffers(userId: string, page: number, limit: number, status?: string): Promise<PaginatedOfferResponse>;
  getCompanyOffers(companyId: string, filters: GetOffersQueryInput): Promise<PaginatedOfferResponse>;
  getOfferById(offerId: string, userId?: string, companyId?: string): Promise<OfferDetailsResponse>;
  acceptOffer(offerId: string, userId: string): Promise<OfferResponse>;
  rejectOffer(offerId: string, userId: string): Promise<OfferResponse>;
}

