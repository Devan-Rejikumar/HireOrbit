import { injectable, inject } from 'inversify';
import { CompanyOfferTemplate } from '@prisma/client';
import { ICompanyOfferTemplateService, PreviewOfferData } from '../interfaces/ICompanyOfferTemplateService';
import { ICompanyOfferTemplateRepository, CreateTemplateInput } from '../../repositories/interfaces/ICompanyOfferTemplateRepository';
import { IOfferPdfService } from '../interfaces/IOfferPdfService';
import { uploadImageToCloudinary } from '../../config/cloudinary';
import { logger } from '../../utils/logger';
import { TYPES } from '../../config/types';
import { Offer } from '@prisma/client';

@injectable()
export class CompanyOfferTemplateService implements ICompanyOfferTemplateService {
  constructor(
    @inject(TYPES.ICompanyOfferTemplateRepository) private _templateRepository: ICompanyOfferTemplateRepository,
    @inject(TYPES.IOfferPdfService) private _pdfService: IOfferPdfService,
  ) {}

  async getTemplate(companyId: string): Promise<CompanyOfferTemplate | null> {
    return await this._templateRepository.findByCompanyId(companyId);
  }

  async createOrUpdateTemplate(companyId: string, data: CreateTemplateInput): Promise<CompanyOfferTemplate> {
    try {
      console.log('[CompanyOfferTemplateService] createOrUpdateTemplate called with:', { companyId, data });
      const result = await this._templateRepository.upsert(companyId, {
        ...data,
        companyId,
      });
      console.log('[CompanyOfferTemplateService] Template upserted successfully:', result);
      return result;
    } catch (error) {
      console.error('[CompanyOfferTemplateService] Error in createOrUpdateTemplate:', error);
      throw error;
    }
  }

  async uploadLogo(companyId: string, fileBuffer: Buffer, fileName: string): Promise<string> {
    try {
      const logoUrl = await uploadImageToCloudinary(fileBuffer, fileName, `offer-templates/${companyId}`);
      
      // Update template with logo URL
      const existingTemplate = await this._templateRepository.findByCompanyId(companyId);
      if (existingTemplate) {
        await this._templateRepository.update(companyId, { logoUrl });
      } else {
        await this._templateRepository.create({
          companyId,
          logoUrl,
        });
      }
      
      return logoUrl;
    } catch (error) {
      logger.error('[CompanyOfferTemplateService] Error uploading logo:', error);
      throw error;
    }
  }

  async uploadSignature(companyId: string, fileBuffer: Buffer, fileName: string): Promise<string> {
    try {
      const signatureUrl = await uploadImageToCloudinary(fileBuffer, fileName, `offer-templates/${companyId}`);
      
      // Update template with signature URL
      const existingTemplate = await this._templateRepository.findByCompanyId(companyId);
      if (existingTemplate) {
        await this._templateRepository.update(companyId, { signatureUrl });
      } else {
        await this._templateRepository.create({
          companyId,
          signatureUrl,
        });
      }
      
      return signatureUrl;
    } catch (error) {
      logger.error('[CompanyOfferTemplateService] Error uploading signature:', error);
      throw error;
    }
  }

  async previewTemplate(companyId: string, sampleOfferData: PreviewOfferData): Promise<Buffer> {
    try {
      const template = await this._templateRepository.findByCompanyId(companyId);
      
      // Create a mock offer for preview
      const mockOffer: Offer = {
        id: 'preview',
        applicationId: 'preview',
        userId: 'preview',
        companyId,
        jobTitle: sampleOfferData.jobTitle,
        ctc: sampleOfferData.ctc,
        joiningDate: new Date(sampleOfferData.joiningDate),
        location: sampleOfferData.location,
        offerMessage: sampleOfferData.offerMessage || null,
        offerExpiryDate: new Date(sampleOfferData.offerExpiryDate),
        status: 'PENDING',
        pdfUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Generate PDF with template (company logo will be resolved in PDF service)
      const pdfBuffer = await this._pdfService.generateOfferPdf(
        mockOffer,
        sampleOfferData.candidateName,
        sampleOfferData.companyName,
        template,
        null, // companyLogoUrl - can be fetched if needed, but template.logoUrl takes precedence
      );
      
      return pdfBuffer;
    } catch (error) {
      logger.error('[CompanyOfferTemplateService] Error generating preview:', error);
      throw error;
    }
  }
}

