import { injectable, inject } from 'inversify';
import { Request, Response } from 'express';
import { TYPES } from '../config/types';
import { ResumeParserService } from '../services/implementations/ResumeParserService';
import { GrokATSService } from '../services/implementations/GrokATSService';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors/AppError';
import { HttpStatusCode } from '../enums/StatusCodes';
import axios from 'axios';

@injectable()
export class ATSController {
  constructor(
    @inject(TYPES.ResumeParserService) private resumeParser: ResumeParserService,
    @inject(TYPES.GrokATSService) private grokATSService: GrokATSService,
  ) {}

  async analyzeResume(req: Request, res: Response): Promise<void> {
    // Check subscription status
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      throw new AppError('User ID is required', HttpStatusCode.UNAUTHORIZED);
    }

    // Check subscription
    const hasActiveSubscription = await this.checkSubscription(userId);
    if (!hasActiveSubscription) {
      throw new AppError(
        'ATS Score Checker is available only for users with an active subscription. Please upgrade to access this feature.',
        HttpStatusCode.FORBIDDEN
      );
    }

    // Validate request
    if (!req.file) {
      throw new AppError('Resume file is required', HttpStatusCode.BAD_REQUEST);
    }

    const { jobDescription } = req.body;
    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length === 0) {
      throw new AppError('Job description is required', HttpStatusCode.BAD_REQUEST);
    }

    // Parse resume
    logger.info('Parsing resume file', {
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    const parseResult = await this.resumeParser.parseResume(req.file.buffer, req.file.mimetype);

    // Analyze with GROQ
    logger.info('Analyzing resume with GROQ', {
      resumeLength: parseResult.text.length,
      jobDescriptionLength: jobDescription.length,
    });

    let analysis;
    try {
      analysis = await this.grokATSService.analyzeATS(parseResult.text, jobDescription);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze resume';
      logger.error('ATS analysis failed:', {
        message: errorMessage,
        userId,
      });
      throw new AppError(
        `ATS analysis failed: ${errorMessage}`,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }

    res.json({
      success: true,
      data: {
        score: analysis.score,
        improvements: analysis.improvements,
        missingKeywords: analysis.missingKeywords,
        strengths: analysis.strengths || [],
        keywordMatch: analysis.keywordMatch,
      },
      message: 'Resume analysis completed successfully',
    });
  }

  private async checkSubscription(userId: string): Promise<boolean> {
    try {
      const subscriptionServiceUrl = process.env.SUBSCRIPTION_SERVICE_URL || 'http://localhost:3005';
      const response = await axios.get(
        `${subscriptionServiceUrl}/api/subscriptions/status`,
        {
          headers: {
            'x-user-id': userId,
            'x-user-role': 'user',
          },
          timeout: 5000,
        }
      );

      const data = response.data?.data;
      return data?.isActive === true;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('Error checking subscription:', {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
        });
      } else {
        logger.error('Error checking subscription:', {
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      // If subscription service is unavailable, allow access (fail open for development)
      // In production, you might want to fail closed
      return process.env.NODE_ENV === 'development';
    }
  }
}

