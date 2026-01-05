import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { IOfferService } from '../services/interfaces/IOfferService';
import { CreateOfferSchema, GetOffersQuerySchema } from '../dto/schemas/offer.schema';
import { buildSuccessResponse } from 'hireorbit-shared-dto';
import { HttpStatusCode, ValidationStatusCode } from '../enums/StatusCodes';
import { TYPES } from '../config/types';
import { AppError } from '../utils/errors/AppError';
import { Messages } from '../constants/Messages';
import '../types/express';
import axios from 'axios';

@injectable()
export class OfferController {
  constructor(
    @inject(TYPES.IOfferService) private _offerService: IOfferService,
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

    if (!offer.pdfUrl) {
      throw new AppError(Messages.OFFER.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    try {
      const response = await axios.get(offer.pdfUrl, {
        responseType: 'stream',
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="offer_${offerId}.pdf"`);
      response.data.pipe(res);
    } catch {
      throw new AppError('Failed to download offer PDF', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }
}

