import { Offer, CompanyOfferTemplate } from '@prisma/client';

export interface IOfferPdfService {
  generateOfferPdf(
    offer: Offer,
    candidateName: string,
    companyName: string,
    template?: CompanyOfferTemplate | null,
    companyLogoUrl?: string | null
  ): Promise<Buffer>;
  uploadPdfToCloudinary(pdfBuffer: Buffer, offerId: string): Promise<string>;
  generateAndUploadPdf(
    offer: Offer,
    candidateName: string,
    companyName: string,
    template?: CompanyOfferTemplate | null,
    companyLogoUrl?: string | null
  ): Promise<string>;
}

