import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import TYPES from '../config/types';
import { IResumeService } from '../services/interfaces/IResumeService';
import { buildErrorResponse } from 'hireorbit-shared-dto';
import { HttpStatusCode } from '../enums/StatusCodes';
import { Messages } from '../constants/Messages';
import { getUserIdFromRequest } from '../utils/requestHelpers';
import { AppError } from '../utils/errors/AppError';
import { logger } from '../utils/logger';

@injectable()
export class ResumeController {
  constructor(
    @inject(TYPES.IResumeService) private _resumeService: IResumeService
  ) {}

  async uploadResume(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserIdFromRequest(req, res);
      if (!userId) return;

      if (!req.body || !req.body.resume) {
        throw new AppError(Messages.RESUME.NO_DATA_PROVIDED, HttpStatusCode.BAD_REQUEST);
      }

      const resumeData = req.body.resume;

      if (typeof resumeData !== 'string' || !resumeData.startsWith('data:')) {
        throw new AppError(Messages.RESUME.INVALID_FORMAT, HttpStatusCode.BAD_REQUEST);
      }

      const [header, base64Data] = resumeData.split(',');
      if (!header || !base64Data) {
        throw new AppError(Messages.RESUME.INVALID_FORMAT, HttpStatusCode.BAD_REQUEST);
      }

      const mimeTypeMatch = header.match(/data:([^;]+)/);
      if (!mimeTypeMatch) {
        throw new AppError(Messages.RESUME.INVALID_FORMAT, HttpStatusCode.BAD_REQUEST);
      }

      const mimeType = mimeTypeMatch[1];

      const allowedMimeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedMimeTypes.includes(mimeType)) {
        throw new AppError('Invalid file type. Only PDF and Word documents are allowed.', HttpStatusCode.BAD_REQUEST);
      }

      let buffer: Buffer;
      try {
        buffer = Buffer.from(base64Data, 'base64');
      } catch {
        throw new AppError('Invalid base64 data', HttpStatusCode.BAD_REQUEST);
      }

      const maxSize = 5 * 1024 * 1024; 
      if (buffer.length > maxSize) {
        throw new AppError('File size exceeds 5MB limit', HttpStatusCode.BAD_REQUEST);
      }

      const extension = mimeType === 'application/pdf' ? 'pdf' : 'doc';
      const cleanFileName = `resume.${extension}`;
      
      logger.debug('[ResumeController] Processing resume upload:', {
        fileName: cleanFileName,
        mimeType,
        size: buffer.length,
        userId
      });

      const result = await this._resumeService.uploadResume(
        userId,
        buffer,
        cleanFileName,
        mimeType
      );
      
      logger.info('[ResumeController] Resume upload successful');
      res.status(HttpStatusCode.OK).json({
        success: true,
        data: { resume: result },
        message: Messages.RESUME.UPLOADED_SUCCESS
      });
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string };
      logger.error('[ResumeController] Resume upload error:', {
        error: err.message,
        stack: err.stack
      });

      if (error instanceof AppError) {
        res.status(error.statusCode).json(buildErrorResponse(error.message));
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
          buildErrorResponse(Messages.RESUME.UPLOAD_FAILED)
        );
      }
    }
  }

  async getResume(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    const resume = await this._resumeService.getResume(userId);
    
    res.status(HttpStatusCode.OK).json({
      success: true,
      data: { resume },
      message: Messages.RESUME.RETRIEVED_SUCCESS
    });
  }

  async deleteResume(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    await this._resumeService.deleteResume(userId);
    
    res.status(HttpStatusCode.OK).json({
      success: true,
      message: Messages.RESUME.DELETED_SUCCESS
    });
  }
}