import { CompanyOfferTemplate } from '@prisma/client';

export interface CreateTemplateInput {
  companyId: string;
  logoUrl?: string | null;
  signatureUrl?: string | null;
  brandColor?: string | null;
  fontFamily?: string | null;
  headerText?: string | null;
  introText?: string | null;
  closingText?: string | null;
  footerText?: string | null;
}

export interface UpdateTemplateInput {
  logoUrl?: string | null;
  signatureUrl?: string | null;
  brandColor?: string | null;
  fontFamily?: string | null;
  headerText?: string | null;
  introText?: string | null;
  closingText?: string | null;
  footerText?: string | null;
}

export interface ICompanyOfferTemplateRepository {
  findByCompanyId(companyId: string): Promise<CompanyOfferTemplate | null>;
  create(data: CreateTemplateInput): Promise<CompanyOfferTemplate>;
  update(companyId: string, data: UpdateTemplateInput): Promise<CompanyOfferTemplate>;
  upsert(companyId: string, data: CreateTemplateInput): Promise<CompanyOfferTemplate>;
}

