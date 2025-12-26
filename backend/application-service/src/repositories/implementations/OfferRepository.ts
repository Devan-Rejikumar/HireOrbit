import { inject, injectable } from 'inversify';
import { PrismaClient, Offer, Prisma } from '@prisma/client';
import { IOfferRepository, OfferFilters, PaginatedOfferResult } from '../interfaces/IOfferRepository';
import { CreateOfferInput } from '../../dto/schemas/offer.schema';
import { TYPES } from '../../config/types';
import { OfferStatus } from '../../enums/OfferStatus';

@injectable()
export class OfferRepository implements IOfferRepository {
  constructor(@inject(TYPES.PrismaClient) private _prisma: PrismaClient) {}

  async create(data: CreateOfferInput & { applicationId: string; userId: string; companyId: string }): Promise<Offer> {
    return await this._prisma.offer.create({
      data: {
        applicationId: data.applicationId,
        userId: data.userId,
        companyId: data.companyId,
        jobTitle: data.jobTitle,
        ctc: data.ctc,
        joiningDate: new Date(data.joiningDate),
        location: data.location,
        offerMessage: data.offerMessage,
        offerExpiryDate: new Date(data.offerExpiryDate),
        status: OfferStatus.PENDING as string,
      },
    });
  }

  async findById(id: string): Promise<Offer | null> {
    return await this._prisma.offer.findUnique({
      where: { id },
    });
  }

  async findByApplicationId(applicationId: string): Promise<Offer | null> {
    return await this._prisma.offer.findUnique({
      where: { applicationId },
    });
  }

  async findByUserId(userId: string, page: number, limit: number, filters?: OfferFilters): Promise<PaginatedOfferResult> {
    const where: Prisma.OfferWhereInput = { userId };

    if (filters?.status) {
      where.status = filters.status;
    }

    const [offers, total] = await Promise.all([
      this._prisma.offer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this._prisma.offer.count({ where }),
    ]);

    return { offers, total };
  }

  async findByCompanyId(companyId: string, page: number, limit: number, filters?: OfferFilters): Promise<PaginatedOfferResult> {
    const where: Prisma.OfferWhereInput = { companyId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.search) {
      where.OR = [
        { jobTitle: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [offers, total] = await Promise.all([
      this._prisma.offer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this._prisma.offer.count({ where }),
    ]);

    return { offers, total };
  }

  async updateStatus(id: string, status: OfferStatus): Promise<Offer> {
    return await this._prisma.offer.update({
      where: { id },
      data: {
        status: status as string,
        updatedAt: new Date(),
      },
    });
  }

  async update(id: string, data: Partial<Offer>): Promise<Offer> {
    return await this._prisma.offer.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  async findExpiredOffers(): Promise<Offer[]> {
    const now = new Date();
    return await this._prisma.offer.findMany({
      where: {
        status: OfferStatus.PENDING as string,
        offerExpiryDate: {
          lt: now,
        },
      },
    });
  }

  async findByUserIdAndId(userId: string, offerId: string): Promise<Offer | null> {
    return await this._prisma.offer.findFirst({
      where: {
        id: offerId,
        userId,
      },
    });
  }

  async findByCompanyIdAndId(companyId: string, offerId: string): Promise<Offer | null> {
    return await this._prisma.offer.findFirst({
      where: {
        id: offerId,
        companyId,
      },
    });
  }
}

