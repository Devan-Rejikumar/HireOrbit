import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { IOfferService } from '../services/interfaces/IOfferService';
import { CreateOfferSchema, GetOffersQuerySchema, GenerateUploadUrlSchema } from '../dto/schemas/offer.schema';
import { buildSuccessResponse } from 'hireorbit-shared-dto';
import { HttpStatusCode, ValidationStatusCode } from '../enums/StatusCodes';
import { TYPES } from '../config/types';
import { AppError } from '../utils/errors/AppError';
import { Messages } from '../constants/Messages';
import { logger } from '../utils/logger';
import '../types/express';
import { CloudinaryService } from '../services/implementations/CloudinaryService';
import cloudinary from '../config/cloudinary';

@injectable()
export class OfferController {
  constructor(
    @inject(TYPES.IOfferService) private _offerService: IOfferService,
    @inject(TYPES.CloudinaryService) private _cloudinaryService: CloudinaryService,
  ) {}

  async createOffer(req: Request, res: Response): Promise<void> {
    const companyId = req.user?.userId;
    const userRole = req.user?.role;

    if (!companyId || userRole !== 'company') {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED,
      );
    }

    const { applicationId } = req.params;

    const validationResult = CreateOfferSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(
        `${Messages.VALIDATION.VALIDATION_FAILED}: ${validationResult.error.message}`,
        ValidationStatusCode.VALIDATION_ERROR,
      );
    }

    const result = await this._offerService.createOffer(applicationId, companyId, validationResult.data);

    res.status(HttpStatusCode.CREATED).json(
      buildSuccessResponse(result, Messages.OFFER.CREATED_SUCCESS),
    );
  }

  async getUserOffers(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || userRole !== 'jobseeker') {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED,
      );
    }

    const validationResult = GetOffersQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      throw new AppError(
        `${Messages.VALIDATION.VALIDATION_FAILED}: ${validationResult.error.message}`,
        ValidationStatusCode.VALIDATION_ERROR,
      );
    }

    const result = await this._offerService.getUserOffers(
      userId,
      validationResult.data.page,
      validationResult.data.limit,
      validationResult.data.status,
    );

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(result, Messages.OFFER.RETRIEVED_SUCCESS),
    );
  }

  async getCompanyOffers(req: Request, res: Response): Promise<void> {
    const companyId = req.user?.userId;
    const userRole = req.user?.role;

    if (!companyId || userRole !== 'company') {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED,
      );
    }

    const validationResult = GetOffersQuerySchema.safeParse(req.query);
    if (!validationResult.success) {
      throw new AppError(
        `${Messages.VALIDATION.VALIDATION_FAILED}: ${validationResult.error.message}`,
        ValidationStatusCode.VALIDATION_ERROR,
      );
    }

    const result = await this._offerService.getCompanyOffers(companyId, validationResult.data);

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(result, Messages.OFFER.RETRIEVED_SUCCESS),
    );
  }

  async getOfferById(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED,
      );
    }

    const { offerId } = req.params;

    const result = await this._offerService.getOfferById(
      offerId,
      userRole === 'jobseeker' ? userId : undefined,
      userRole === 'company' ? userId : undefined,
    );

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(result, Messages.OFFER.RETRIEVED_SUCCESS),
    );
  }

  async acceptOffer(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || userRole !== 'jobseeker') {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED,
      );
    }

    const { offerId } = req.params;

    const result = await this._offerService.acceptOffer(offerId, userId);

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(result, Messages.OFFER.ACCEPTED_SUCCESS),
    );
  }

  async rejectOffer(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || userRole !== 'jobseeker') {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED,
      );
    }

    const { offerId } = req.params;

    const result = await this._offerService.rejectOffer(offerId, userId);

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(result, Messages.OFFER.REJECTED_SUCCESS),
    );
  }

  async generateUploadUrl(req: Request, res: Response): Promise<void> {
    const companyId = req.user?.userId;
    const userRole = req.user?.role;

    if (!companyId || userRole !== 'company') {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED,
      );
    }

    const validationResult = GenerateUploadUrlSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(
        `${Messages.VALIDATION.VALIDATION_FAILED}: ${validationResult.error.message}`,
        ValidationStatusCode.VALIDATION_ERROR,
      );
    }

    const { offerId } = validationResult.data;

    // Verify that the offer exists and belongs to this company
    const offer = await this._offerService.getOfferById(offerId, undefined, companyId);
    if (!offer) {
      throw new AppError(Messages.OFFER.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    // Generate signed upload URL for the offer PDF
    const uploadCredentials = this._cloudinaryService.generateSignedUploadUrl(
      'offer-letters',
      `offer_${offerId}`,
      'raw',
      companyId
    );

    logger.info('Generated upload URL for offer PDF', {
      offerId,
      publicId: uploadCredentials.publicId,
      companyId,
    });

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(uploadCredentials, 'Upload URL generated successfully'),
    );
  }

async attachOfferPdf(req: Request, res: Response): Promise<void> {
  const companyId = req.user?.userId;
  const userRole = req.user?.role;

  if (!companyId || userRole !== 'company') {
    throw new AppError(Messages.VALIDATION.UNAUTHORIZED_ACCESS, HttpStatusCode.UNAUTHORIZED);
  }

  const { offerId } = req.params;
  const { pdfPublicId } = req.body;

  logger.info('gggggggggggggg',pdfPublicId);

  if (!pdfPublicId) {
    throw new AppError('pdfPublicId is required', ValidationStatusCode.VALIDATION_ERROR);
  }
  const cleanPublicId = pdfPublicId.replace(/\.pdf$/i, '');

  await this._offerService.attachPdfPublicId(offerId, cleanPublicId);

  logger.info('ATTACH PDF BACKEND CHECK', {
  pdfPublicIdReceived: pdfPublicId,
  endsWithPdf: pdfPublicId.endsWith('.pdf'),
});


  await this._offerService.attachPdfPublicId(offerId, pdfPublicId);

  res.status(HttpStatusCode.OK).json(
    buildSuccessResponse({ pdfPublicId }, 'Offer PDF attached successfully')
  );
}


  async downloadOfferPdf(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED,
      );
    }

    const { offerId } = req.params;
    const offer = await this._offerService.getOfferById(
      offerId,
      userRole === 'jobseeker' ? userId : undefined,
      userRole === 'company' ? userId : undefined,
    );

    if (!(offer as any).pdfPublicId) {
      throw new AppError('PDF not available for this offer', HttpStatusCode.NOT_FOUND);
    }

    const pdfPublicId = (offer as any).pdfPublicId;

    // Log for debugging
    logger.info('Generating signed URL for offer PDF', {
      offerId,
      pdfPublicId,
      userId,
      userRole,
    });

    try {
      // Verify the resource exists in Cloudinary and get actual details
      const { actualPublicId, accessType } = await this._cloudinaryService.verifyUpload(pdfPublicId, 'raw');

      logger.info('Resource verified', {
        offerId,
        storedPublicId: pdfPublicId,
        actualPublicId,
        accessType,
      });

      // Generate signed URL with 30 minute expiration using CloudinaryService
      // Use the actual publicId from Cloudinary
      const { signedUrl, expiresAt } = this._cloudinaryService.generateSignedAccessUrl(
        actualPublicId,
        'raw',
        1800,
        accessType as 'authenticated' | 'upload'
      );

      logger.info('Successfully generated signed download URL', {
        offerId,
        expiresAt: expiresAt.toISOString(),
      });

      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(
          {
            signedUrl,
            expiresAt: expiresAt.toISOString(),
          },
          Messages.OFFER.RETRIEVED_SUCCESS,
        ),
      );
    } catch (error: any) {
      logger.error('Failed to generate signed URL for offer PDF', {
        offerId,
        pdfPublicId,
        error: error?.message,
        stack: error?.stack,
      });
      
      // Provide helpful error message
      if (error?.message?.includes('verification failed') || error?.message?.includes('not found')) {
        throw new AppError('PDF file not found in storage', HttpStatusCode.NOT_FOUND);
      }
      
      throw new AppError(
        'Failed to generate download URL. Please try again later.',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async debugOfferPdf(req: Request, res: Response): Promise<void> {
  const { offerId } = req.params;
  
  try {
    const offer = await this._offerService.getOfferById(offerId);
    const publicId = (offer as any).pdfPublicId;
    
    // Verify resource exists in Cloudinary
    const resource = await cloudinary.api.resource(publicId, {
      resource_type: 'raw',
      type: 'authenticated'
    });
    
    res.json({
      publicId,
      resource,
      cloudinaryDashboardUrl: `https://console.cloudinary.com/console/${this._cloudinaryService['cloudName']}/media_library/search?q=${publicId}`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
}

