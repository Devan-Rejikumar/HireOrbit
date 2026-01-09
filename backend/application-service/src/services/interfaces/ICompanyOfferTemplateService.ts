import { CompanyOfferTemplate } from '@prisma/client';
import { CreateTemplateInput } from '../../repositories/interfaces/ICompanyOfferTemplateRepository';

export interface PreviewOfferData {
  jobTitle: string;
  ctc: number;
  joiningDate: string;
  location: string;
  offerMessage?: string;
  offerExpiryDate: string;
  candidateName: string;
  companyName: string;
}

export interface ICompanyOfferTemplateService {
  getTemplate(companyId: string): Promise<CompanyOfferTemplate | null>;
  createOrUpdateTemplate(companyId: string, data: CreateTemplateInput): Promise<CompanyOfferTemplate>;
  uploadLogo(companyId: string, fileBuffer: Buffer, fileName: string): Promise<string>;
  uploadSignature(companyId: string, fileBuffer: Buffer, fileName: string): Promise<string>;
  previewTemplate(companyId: string, sampleOfferData: PreviewOfferData): Promise<Buffer>;
}

