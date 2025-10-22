import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { IInterviewService } from '../services/interface/IInterviewService';
import { CreateInterviewSchema, UpdateInterviewSchema, InterviewDecisionSchema } from '../dto/schemas/interview.schema';
import { buildSuccessResponse, buildErrorResponse } from '../../../shared-dto/src';
import { HttpStatusCode, ValidationStatusCode } from '../enums/StatusCodes';
import { TYPES } from '../config/types';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
        username?: string;
        firstName?: string;
        lastName?: string;
        isActive?: boolean;
        createdAt?: string;
        updatedAt?: string;
      };
    }
  }
}

@injectable()
export class InterviewController {
  constructor(
    @inject(TYPES.IInterviewService) private interviewService: IInterviewService
  ) {}

  async scheduleInterview(req: Request, res: Response): Promise<void> {
    try {
      console.log('InterviewController scheduleInterview called');

      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || userRole !== 'company') {
        console.log('InterviewController Unauthorized access');
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse('Unauthorized access', 'Only companies can schedule interviews')
        );
        return;
      }

      const validationResult = CreateInterviewSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message)
        );
        return;
      }

      const validatedData = validationResult.data;
      const result = await this.interviewService.scheduleInterview(validatedData, userId);
      
      console.log('InterviewController Interview scheduled:', {
        id: result.id,
        applicationId: result.applicationId,
        scheduledAt: result.scheduledAt,
        type: result.type
      });

      res.status(HttpStatusCode.CREATED).json(
        buildSuccessResponse(result, 'Interview scheduled successfully')
      );
    } catch (error: unknown) {
      console.error('InterviewController Error in scheduleInterview:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.BAD_REQUEST).json(
        buildErrorResponse(errorMessage, 'Failed to schedule interview')
      );
    }
  }

  async getInterviewById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || !userRole) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse('Unauthorized access', 'Authentication required')
        );
        return;
      }

      const { id } = req.params;
      const result = await this.interviewService.getInterviewById(id);

      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(result, 'Interview details retrieved successfully')
      );
    } catch (error: unknown) {
      console.error('InterviewController Error in getInterviewById:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.NOT_FOUND).json(
        buildErrorResponse(errorMessage, 'Interview not found')
      );
    }
  }

  async updateInterview(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || (userRole !== 'company' && userRole !== 'jobseeker')) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse('Unauthorized access', 'Only companies and job seekers can update interviews')
        );
        return;
      }

      const { id } = req.params;
      const validationResult = UpdateInterviewSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message)
        );
        return;
      }

      const validatedData = validationResult.data;
      const result = await this.interviewService.updateInterview(id, validatedData, userId);

      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(result, 'Interview updated successfully')
      );
    } catch (error: unknown) {
      console.error('InterviewController Error in updateInterview:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.BAD_REQUEST).json(
        buildErrorResponse(errorMessage, 'Failed to update interview')
      );
    }
  }

  async cancelInterview(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || (userRole !== 'company' && userRole !== 'jobseeker')) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse('Unauthorized access', 'Only companies and job seekers can cancel interviews')
        );
        return;
      }

      const { id } = req.params;
      const { reason } = req.body;
      
      const result = await this.interviewService.cancelInterview(id, userId, reason);

      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(result, 'Interview cancelled successfully')
      );
    } catch (error: unknown) {
      console.error('InterviewController Error in cancelInterview:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.BAD_REQUEST).json(
        buildErrorResponse(errorMessage, 'Failed to cancel interview')
      );
    }
  }

  async getInterviewsByApplication(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || !userRole) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse('Unauthorized access', 'Authentication required')
        );
        return;
      }

      const { applicationId } = req.params;
      const result = await this.interviewService.getInterviewsByApplication(applicationId);

      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(result, 'Interviews retrieved successfully')
      );
    } catch (error: unknown) {
      console.error('InterviewController Error in getInterviewsByApplication:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(errorMessage, 'Failed to retrieve interviews')
      );
    }
  }

  async getCompanyInterviews(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || userRole !== 'company') {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse('Unauthorized access', 'Only companies can view company interviews')
        );
        return;
      }

      const result = await this.interviewService.getCompanyInterviews(userId);

      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(result, 'Company interviews retrieved successfully')
      );
    } catch (error: unknown) {
      console.error('InterviewController Error in getCompanyInterviews:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(errorMessage, 'Failed to retrieve company interviews')
      );
    }
  }

  async getCandidateInterviews(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || userRole !== 'jobseeker') {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse('Unauthorized access', 'Only job seekers can view candidate interviews')
        );
        return;
      }

      const result = await this.interviewService.getCandidateInterviews(userId);

      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(result, 'Candidate interviews retrieved successfully')
      );
    } catch (error: unknown) {
      console.error('InterviewController Error in getCandidateInterviews:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(errorMessage, 'Failed to retrieve candidate interviews')
      );
    }
  }

  async makeInterviewDecision(req: Request, res: Response): Promise<void> {
    try {
      console.log('InterviewController makeInterviewDecision called');

      const userId = req.user?.userId || req.headers['x-user-id'] as string;
      const userRole = req.user?.role || req.headers['x-user-role'] as string;

      if (!userId || userRole !== 'company') {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse('Unauthorized access', 'Only companies can make interview decisions')
        );
        return;
      }

      const { id } = req.params;
      const decisionData = req.body;

      // Validate the decision data
      const validation = InterviewDecisionSchema.safeParse(decisionData);
      if (!validation.success) {
        res.status(HttpStatusCode.BAD_REQUEST).json(
          buildErrorResponse(
            'Validation failed',
            validation.error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ')
          )
        );
        return;
      }

      const result = await this.interviewService.makeInterviewDecision(id, validation.data, userId);

      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(result, 'Interview decision recorded successfully')
      );
    } catch (error: unknown) {
      console.error('InterviewController Error in makeInterviewDecision:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(errorMessage, 'Failed to make interview decision')
      );
    }
  }
}