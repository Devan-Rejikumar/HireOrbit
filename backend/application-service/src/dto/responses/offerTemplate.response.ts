import { CompanyOfferTemplate } from '@prisma/client';

export interface CompanyOfferTemplateResponse {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface PreviewTemplateResponse {
  pdfBuffer: Buffer;
}

export function mapTemplateToResponse(template: CompanyOfferTemplate): CompanyOfferTemplateResponse {
  return {
    id: template.id,
    companyId: template.companyId,
    logoUrl: template.logoUrl,
    signatureUrl: template.signatureUrl,
    brandColor: template.brandColor,
    fontFamily: template.fontFamily,
    headerText: template.headerText,
    introText: template.introText,
    closingText: template.closingText,
    footerText: template.footerText,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  }
}

