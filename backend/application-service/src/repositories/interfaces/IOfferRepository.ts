import { Offer } from '@prisma/client';
import { OfferStatus } from '../../enums/OfferStatus';
import { CreateOfferInput } from '../../dto/schemas/offer.schema';

export interface OfferFilters {
  status?: OfferStatus;
  search?: string;
}

export interface PaginatedOfferResult {
  offers: Offer[];
  total: number;
}

export interface IOfferRepository {
  create(data: CreateOfferInput & { applicationId: string; userId: string; companyId: string }): Promise<Offer>;
  findById(id: string): Promise<Offer | null>;
  findByApplicationId(applicationId: string): Promise<Offer | null>;
  findByUserId(userId: string, page: number, limit: number, filters?: OfferFilters): Promise<PaginatedOfferResult>;
  findByCompanyId(companyId: string, page: number, limit: number, filters?: OfferFilters): Promise<PaginatedOfferResult>;
  updateStatus(id: string, status: OfferStatus): Promise<Offer>;
  update(id: string, data: Partial<Offer>): Promise<Offer>;
  findExpiredOffers(): Promise<Offer[]>;
  findByUserIdAndId(userId: string, offerId: string): Promise<Offer | null>;
  findByCompanyIdAndId(companyId: string, offerId: string): Promise<Offer | null>;
}

