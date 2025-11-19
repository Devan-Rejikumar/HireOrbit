import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import TYPES from '../config/types';
import { ICertificationService } from '../services/interfaces/ICertificationService';
import { buildErrorResponse, buildSuccessResponse } from 'shared-dto';
import { HttpStatusCode } from '../enums/StatusCodes';
import { Messages } from '../constants/Messages';
import { getUserIdFromRequest } from '../utils/requestHelpers';
import { AppError } from '../utils/errors/AppError';

@injectable()
export class CertificationController {
  constructor(@inject(TYPES.ICertificationService) private _certificationService: ICertificationService) {}

  async addCertification(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    const certificationData = req.body;
    const result = await this._certificationService.addCertification(userId, certificationData);
    
    res.status(HttpStatusCode.CREATED).json(
      buildSuccessResponse(result, Messages.CERTIFICATION.ADDED_SUCCESS)
    );
  }

  async getCertifications(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    const certifications = await this._certificationService.getCertifications(userId);
    
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(certifications, Messages.CERTIFICATION.RETRIEVED_ALL_SUCCESS)
    );
  }

  async updateCertification(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    const { certificationId } = req.params;
    if (!certificationId) {
      throw new AppError(Messages.CERTIFICATION.ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }

    const updates = req.body;
    console.log('CERTIFICATION-CONTROLLER Received update data:', JSON.stringify(updates, null, 2));
    const result = await this._certificationService.updateCertification(userId, certificationId, updates);
    
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(result, Messages.CERTIFICATION.UPDATED_SUCCESS)
    );
  }

  async deleteCertification(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    const { certificationId } = req.params;
    if (!certificationId) {
      throw new AppError(Messages.CERTIFICATION.ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }

    await this._certificationService.deleteCertification(userId, certificationId);
    
    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(null, Messages.CERTIFICATION.DELETED_SUCCESS)
    );
  }

  async getCertificationById(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    const { certificationId } = req.params;
    if (!certificationId) {
      throw new AppError(Messages.CERTIFICATION.ID_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }

    const certification = await this._certificationService.getCertificationById(userId, certificationId);
    
    if (!certification) {
      throw new AppError(Messages.CERTIFICATION.NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(certification, Messages.CERTIFICATION.RETRIEVED_SUCCESS)
    );
  }
}