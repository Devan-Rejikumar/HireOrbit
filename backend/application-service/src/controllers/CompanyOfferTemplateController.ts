import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { ICompanyOfferTemplateService } from '../services/interfaces/ICompanyOfferTemplateService';
import { CreateTemplateSchema, PreviewTemplateSchema } from '../dto/schemas/offerTemplate.schema';
import { buildSuccessResponse } from 'hireorbit-shared-dto';
import { HttpStatusCode, ValidationStatusCode } from '../enums/StatusCodes';
import { TYPES } from '../config/types';
import { AppError } from '../utils/errors/AppError';
import { Messages } from '../constants/Messages';
import { mapTemplateToResponse } from '../dto/responses/offerTemplate.response';
import '../types/express';

@injectable()
export class CompanyOfferTemplateController {
  constructor(
    @inject(TYPES.ICompanyOfferTemplateService) private _templateService: ICompanyOfferTemplateService,
  ) {}

  async getTemplate(req: Request, res: Response): Promise<void> {
    const companyId = req.user?.userId;
    const userRole = req.user?.role;

    if (!companyId || userRole !== 'company') {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED,
      );
    }

    const template = await this._templateService.getTemplate(companyId);
    
    if (!template) {
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(null, 'No template found. Using default template.'),
      );
      return;
    }

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(mapTemplateToResponse(template), 'Template retrieved successfully'),
    );
  }

  async createOrUpdateTemplate(req: Request, res: Response): Promise<void> {
    const companyId = req.user?.userId;
    const userRole = req.user?.role;

    if (!companyId || userRole !== 'company') {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED,
      );
    }

    const validationResult = CreateTemplateSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(
        `${Messages.VALIDATION.VALIDATION_FAILED}: ${validationResult.error.message}`,
        ValidationStatusCode.VALIDATION_ERROR,
      );
    }

    const template = await this._templateService.createOrUpdateTemplate(companyId, {
      companyId,
      ...validationResult.data,
    });

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(mapTemplateToResponse(template), 'Template saved successfully'),
    );
  }

  async uploadLogo(req: Request, res: Response): Promise<void> {
    const companyId = req.user?.userId;
    const userRole = req.user?.role;

    if (!companyId || userRole !== 'company') {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED,
      );
    }

    if (!req.file) {
      throw new AppError('Logo file is required', HttpStatusCode.BAD_REQUEST);
    }

    const logoUrl = await this._templateService.uploadLogo(
      companyId,
      req.file.buffer,
      req.file.originalname,
    );

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ logoUrl }, 'Logo uploaded successfully'),
    );
  }

  async uploadSignature(req: Request, res: Response): Promise<void> {
    const companyId = req.user?.userId;
    const userRole = req.user?.role;

    if (!companyId || userRole !== 'company') {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED,
      );
    }

    if (!req.file) {
      throw new AppError('Signature file is required', HttpStatusCode.BAD_REQUEST);
    }

    const signatureUrl = await this._templateService.uploadSignature(
      companyId,
      req.file.buffer,
      req.file.originalname,
    );

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ signatureUrl }, 'Signature uploaded successfully'),
    );
  }

  async previewTemplate(req: Request, res: Response): Promise<void> {
    const companyId = req.user?.userId;
    const userRole = req.user?.role;

    if (!companyId || userRole !== 'company') {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED,
      );
    }

    const validationResult = PreviewTemplateSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(
        `${Messages.VALIDATION.VALIDATION_FAILED}: ${validationResult.error.message}`,
        ValidationStatusCode.VALIDATION_ERROR,
      );
    }

    const pdfBuffer = await this._templateService.previewTemplate(companyId, validationResult.data);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="offer-preview.pdf"');
    res.status(HttpStatusCode.OK).send(pdfBuffer);
  }
}

