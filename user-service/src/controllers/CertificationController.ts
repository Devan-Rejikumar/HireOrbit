import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import TYPES from '../config/types';
import { ICertificationService } from '../services/interfaces/ICertificationService';
import { buildErrorResponse, buildSuccessResponse } from 'shared-dto';
import { HttpStatusCode } from '../enums/StatusCodes';

interface RequestWithUser extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    userType: string;
  };
}

@injectable()
export class CertificationController {
  constructor(@inject(TYPES.ICertificationService) private _certificationService: ICertificationService) {}

  async addCertification(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as RequestWithUser).user?.userId || req.headers['x-user-id'] as string;
      
      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse('User not authenticated', 'UNAUTHORIZED')
        );
        return;
      }

      const certificationData = req.body;
      const result = await this._certificationService.addCertification(userId, certificationData);
      
      res.status(HttpStatusCode.CREATED).json(
        buildSuccessResponse(result, 'Certification added successfully')
      );
    } catch (error) {
      console.error('Error adding certification:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(error instanceof Error ? error.message : 'Failed to add certification', 'INTERNAL_SERVER_ERROR')
      );
    }
  }

  async getCertifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as RequestWithUser).user?.userId || req.headers['x-user-id'] as string;
      
      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse('User not authenticated', 'UNAUTHORIZED')
        );
        return;
      }

      const certifications = await this._certificationService.getCertifications(userId);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(certifications, 'Certifications retrieved successfully')
      );
    } catch (error) {
      console.error('Error getting certifications:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(error instanceof Error ? error.message : 'Failed to get certifications', 'INTERNAL_SERVER_ERROR')
      );
    }
  }

  async updateCertification(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as RequestWithUser).user?.userId || req.headers['x-user-id'] as string;
      const { certificationId } = req.params;
      
      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse('User not authenticated', 'UNAUTHORIZED')
        );
        return;
      }

      if (!certificationId) {
        res.status(HttpStatusCode.BAD_REQUEST).json(
          buildErrorResponse('Certification ID is required', 'BAD_REQUEST')
        );
        return;
      }

      const updates = req.body;
      console.log('CERTIFICATION-CONTROLLER Received update data:', JSON.stringify(updates, null, 2));
      const result = await this._certificationService.updateCertification(userId, certificationId, updates);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(result, 'Certification updated successfully')
      );
    } catch (error) {
      console.error('Error updating certification:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(error instanceof Error ? error.message : 'Failed to update certification', 'INTERNAL_SERVER_ERROR')
      );
    }
  }

  async deleteCertification(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as RequestWithUser).user?.userId || req.headers['x-user-id'] as string;
      const { certificationId } = req.params;
      
      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse('User not authenticated', 'UNAUTHORIZED')
        );
        return;
      }

      if (!certificationId) {
        res.status(HttpStatusCode.BAD_REQUEST).json(
          buildErrorResponse('Certification ID is required', 'BAD_REQUEST')
        );
        return;
      }

      await this._certificationService.deleteCertification(userId, certificationId);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(null, 'Certification deleted successfully')
      );
    } catch (error) {
      console.error('Error deleting certification:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(error instanceof Error ? error.message : 'Failed to delete certification', 'INTERNAL_SERVER_ERROR')
      );
    }
  }

  async getCertificationById(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as RequestWithUser).user?.userId || req.headers['x-user-id'] as string;
      const { certificationId } = req.params;
      
      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse('User not authenticated', 'UNAUTHORIZED')
        );
        return;
      }

      if (!certificationId) {
        res.status(HttpStatusCode.BAD_REQUEST).json(
          buildErrorResponse('Certification ID is required', 'BAD_REQUEST')
        );
        return;
      }

      const certification = await this._certificationService.getCertificationById(userId, certificationId);
      
      if (!certification) {
        res.status(HttpStatusCode.NOT_FOUND).json(
          buildErrorResponse('Certification not found', 'NOT_FOUND')
        );
        return;
      }

      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(certification, 'Certification retrieved successfully')
      );
    } catch (error) {
      console.error('Error getting certification by ID:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(error instanceof Error ? error.message : 'Failed to get certification', 'INTERNAL_SERVER_ERROR')
      );
    }
  }
}