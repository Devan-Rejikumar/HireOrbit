import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { PdfService } from '../services/pdfService';
import { AiService } from '../services/aiService';
import { IApplicationRepository } from '../repositories/interfaces/IApplicationRepository';
import { IJobServiceClient } from '../services/interfaces/IJobServiceClient';
import { TYPES } from '../config/types';
import { AppError } from '../utils/errors/AppError';
import { HttpStatusCode } from '../enums/StatusCodes';
import '../types/express';

@injectable()
export class AtsController {
  private pdfService: PdfService;
  private aiService: AiService;

  constructor(
    @inject(TYPES.IApplicationRepository) private _applicationRepository: IApplicationRepository,
    @inject(TYPES.IJobServiceClient) private _jobServiceClient: IJobServiceClient,
  ) {
    this.pdfService = new PdfService();
    this.aiService = new AiService();
  }

  public analyzeResume = async (req: Request, res: Response): Promise<void> => {
    try {
      const { resumeBase64, fileName, jobDescription } = req.body;

      if (!resumeBase64) {
        res.status(400).json({ message: 'No resume file uploaded (resumeBase64 required)' });
        return;
      }

      if (!jobDescription) {
        res.status(400).json({ message: 'Job description is required' });
        return;
      }

      // 1. Decode base64 to buffer and parse PDF
      const pdfBuffer = Buffer.from(resumeBase64, 'base64');
      const resumeText = await this.pdfService.parsePdfFromBuffer(pdfBuffer);

      // 2. AI Analysis
      const analysisResult = await this.aiService.analyzeResume(resumeText, jobDescription);

      res.status(200).json({
        success: true,
        data: analysisResult
      });

    } catch (error: any) {
      console.error('ATS Analysis Error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error analyzing resume'
      });
    }
  };

  public analyzeApplicationResume = async (req: Request, res: Response): Promise<void> => {
    try {
      const { applicationId } = req.params;
      const userId = req.user?.userId;
      const userRole = req.user?.role;

      if (!userId || userRole !== 'company') {
        res.status(HttpStatusCode.UNAUTHORIZED).json({
          success: false,
          message: 'Unauthorized access. Company authentication required.',
        });
        return;
      }

      if (!applicationId) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: 'Application ID is required',
        });
        return;
      }

      // 1. Fetch application
      const application = await this._applicationRepository.findById(applicationId);
      if (!application) {
        res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: 'Application not found',
        });
        return;
      }

      // 2. Verify company owns this application
      if (application.companyId !== userId) {
        res.status(HttpStatusCode.FORBIDDEN).json({
          success: false,
          message: 'Access denied. You do not have permission to analyze this application.',
        });
        return;
      }

      // 3. Check if resume exists
      if (!application.resumeUrl) {
        res.status(HttpStatusCode.BAD_REQUEST).json({
          success: false,
          message: 'Resume not found for this application',
        });
        return;
      }

      // 4. Fetch job description
      const jobData = await this._jobServiceClient.getJobById(application.jobId);
      if (!jobData?.data?.job?.description) {
        res.status(HttpStatusCode.NOT_FOUND).json({
          success: false,
          message: 'Job description not found',
        });
        return;
      }

      const jobDescription = jobData.data.job.description;

      // 5. Download resume from Cloudinary URL
      let resumeBuffer: Buffer;
      try {
        const resumeResponse = await fetch(application.resumeUrl);
        if (!resumeResponse.ok) {
          throw new Error(`Failed to fetch resume: ${resumeResponse.statusText}`);
        }
        const arrayBuffer = await resumeResponse.arrayBuffer();
        resumeBuffer = Buffer.from(arrayBuffer);
      } catch (error: unknown) {
        const err = error as { message?: string };
        console.error('Error downloading resume:', err);
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: `Failed to download resume: ${err.message || 'Unknown error'}`,
        });
        return;
      }

      // 6. Parse PDF
      const resumeText = await this.pdfService.parsePdfFromBuffer(resumeBuffer);

      // 7. AI Analysis
      const analysisResult = await this.aiService.analyzeResume(resumeText, jobDescription);

      res.status(HttpStatusCode.OK).json({
        success: true,
        data: analysisResult,
      });

    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('ATS Application Analysis Error:', err);
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || 'Error analyzing application resume',
      });
    }
  };
}
