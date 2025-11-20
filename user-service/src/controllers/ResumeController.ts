import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import TYPES from '../config/types';
import { IResumeService } from '../services/interfaces/IResumeService';
import { buildErrorResponse, buildSuccessResponse } from 'shared-dto';
import { HttpStatusCode } from '../enums/StatusCodes';
import { Messages } from '../constants/Messages';
import { getUserIdFromRequest } from '../utils/requestHelpers';
import { AppError } from '../utils/errors/AppError';

@injectable()
export class ResumeController {
  constructor(
    @inject(TYPES.IResumeService) private _resumeService: IResumeService
  ) {}

  async uploadResume(req: Request, res: Response): Promise<void> {
    const userId = getUserIdFromRequest(req, res);
    if (!userId) return;

    if (!req.body || !req.body.resume) {
      throw new AppError(Messages.RESUME.NO_DATA_PROVIDED, HttpStatusCode.BAD_REQUEST);
    }

    const resumeData = req.body.resume;

    if (typeof resumeData === 'string' && resumeData.startsWith('data:')) {
      const [header, base64Data] = resumeData.split(',');
      const mimeType = header.split(':')[1].split(';')[0];
      const buffer = Buffer.from(base64Data, 'base64');
      const extension = mimeType === 'application/pdf' ? 'pdf' : 'doc';
      const cleanFileName = `resume.${extension}`;
      
      console.log('🔍 [ResumeController] Processing resume upload:', {
        fileName: cleanFileName,
        mimeType,
        size: buffer.length
      });
      const result = await this._resumeService.uploadResume(
        userId,
        buffer,
        cleanFileName,
        mimeType
      );
      
      res.status(HttpStatusCode.OK).json({
        success: true,
        data: { resume: result },
        message: Messages.RESUME.UPLOADED_SUCCESS
      });
    } else {
      throw new AppError(Messages.RESUME.INVALID_FORMAT, HttpStatusCode.BAD_REQUEST);
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