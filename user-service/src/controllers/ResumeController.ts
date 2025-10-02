import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { IResumeService } from '../services/IResumeService';
import { buildErrorResponse, buildSuccessResponse } from 'shared-dto';
import { HttpStatusCode } from '../enums/StatusCodes';

interface RequestWithUser extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    userType: string;
    companyName?: string;
  };
}

@injectable()
export class ResumeController {
  constructor(
    @inject('IResumeService') private resumeService: IResumeService
  ) {}

  async uploadResume(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as RequestWithUser).user?.userId || req.headers['x-user-id'] as string;
      
      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse('User not authenticated')
        );
        return;
      }
      if (!req.body || !req.body.resume) {
        res.status(HttpStatusCode.BAD_REQUEST).json(
          buildErrorResponse('No resume data provided', 'Resume file required')
        );
        return;
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
        const result = await this.resumeService.uploadResume(
          userId,
          buffer,
          cleanFileName,
          mimeType
        );
        
        res.status(HttpStatusCode.OK).json({
          success: true,
          data: { resume: result },
          message: 'Resume uploaded successfully'
        });
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json(
          buildErrorResponse('Invalid resume data format', 'Resume must be base64 data URI')
        );
      }
    } catch (error) {
      console.error('Resume upload error:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse('Failed to upload resume', 'Internal server error')
      );
    }
  }

  async getResume(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as RequestWithUser).user?.userId || req.headers['x-user-id'] as string;
      
      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse('User not authenticated')
        );
        return;
      }

      const resume = await this.resumeService.getResume(userId);
      
      res.status(HttpStatusCode.OK).json({
        success: true,
        data: { resume },
        message: 'Resume retrieved successfully'
      });
    } catch (error) {
      console.error('Get resume error:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse('Failed to get resume', 'Internal server error')
      );
    }
  }

  async deleteResume(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as RequestWithUser).user?.userId || req.headers['x-user-id'] as string;
      
      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse('User not authenticated')
        );
        return;
      }

      await this.resumeService.deleteResume(userId);
      
      res.status(HttpStatusCode.OK).json({
        success: true,
        message: 'Resume deleted successfully'
      });
    } catch (error) {
      console.error('Delete resume error:', error);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse('Failed to delete resume', 'Internal server error')
      );
    }
  }
}