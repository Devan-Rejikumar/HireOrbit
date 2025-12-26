import { inject, injectable } from 'inversify';
import { PrismaClient, CompanyOfferTemplate } from '@prisma/client';
import { ICompanyOfferTemplateRepository, CreateTemplateInput, UpdateTemplateInput } from '../interfaces/ICompanyOfferTemplateRepository';
import { TYPES } from '../../config/types';

@injectable()
export class CompanyOfferTemplateRepository implements ICompanyOfferTemplateRepository {
  constructor(@inject(TYPES.PrismaClient) private _prisma: PrismaClient) {}

  async findByCompanyId(companyId: string): Promise<CompanyOfferTemplate | null> {
    return await this._prisma.companyOfferTemplate.findUnique({
      where: { companyId },
    });
  }

  async create(data: CreateTemplateInput): Promise<CompanyOfferTemplate> {
    return await this._prisma.companyOfferTemplate.create({
      data: {
        companyId: data.companyId,
        logoUrl: data.logoUrl,
        signatureUrl: data.signatureUrl,
        brandColor: data.brandColor,
        fontFamily: data.fontFamily,
        headerText: data.headerText,
        introText: data.introText,
        closingText: data.closingText,
        footerText: data.footerText,
      },
    });
  }

  async update(companyId: string, data: UpdateTemplateInput): Promise<CompanyOfferTemplate> {
    return await this._prisma.companyOfferTemplate.update({
      where: { companyId },
      data: {
        logoUrl: data.logoUrl,
        signatureUrl: data.signatureUrl,
        brandColor: data.brandColor,
        fontFamily: data.fontFamily,
        headerText: data.headerText,
        introText: data.introText,
        closingText: data.closingText,
        footerText: data.footerText,
        updatedAt: new Date(),
      },
    });
  }

  async upsert(companyId: string, data: CreateTemplateInput): Promise<CompanyOfferTemplate> {
    return await this._prisma.companyOfferTemplate.upsert({
      where: { companyId },
      update: {
        logoUrl: data.logoUrl,
        signatureUrl: data.signatureUrl,
        brandColor: data.brandColor,
        fontFamily: data.fontFamily,
        headerText: data.headerText,
        introText: data.introText,
        closingText: data.closingText,
        footerText: data.footerText,
        updatedAt: new Date(),
      },
      create: {
        companyId: data.companyId,
        logoUrl: data.logoUrl,
        signatureUrl: data.signatureUrl,
        brandColor: data.brandColor,
        fontFamily: data.fontFamily,
        headerText: data.headerText,
        introText: data.introText,
        closingText: data.closingText,
        footerText: data.footerText,
      },
    });
  }
}

