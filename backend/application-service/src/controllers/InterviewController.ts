import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { IInterviewService } from '../services/interfaces/IInterviewService';
import { CreateInterviewSchema, UpdateInterviewSchema, InterviewDecisionSchema } from '../dto/schemas/interview.schema';
import { buildSuccessResponse } from 'hireorbit-shared-dto';
import { HttpStatusCode, ValidationStatusCode } from '../enums/StatusCodes';
import { TYPES } from '../config/types';
import { AppError } from '../utils/errors/AppError';
import { Messages } from '../constants/Messages';
import { logger } from '../utils/logger';
import '../types/express';
import { AppConfig } from '../config/app.config';
import { RTCIceServer } from '../types/webrtc.types';

@injectable()
export class InterviewController {
  constructor(
    @inject(TYPES.IInterviewService) private _interviewService: IInterviewService,
  ) {}

  async scheduleInterview(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId ;
    const userRole = req.user?.role ;

    if (!userId || userRole !== 'company') {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED,
      );
    }

    const validationResult = CreateInterviewSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(
        `${Messages.VALIDATION.VALIDATION_FAILED}: ${validationResult.error.message}`,
        ValidationStatusCode.VALIDATION_ERROR,
      );
    }

    const validatedData = validationResult.data;
    const result = await this._interviewService.scheduleInterview(validatedData, userId);
    
    logger.info('InterviewController Interview scheduled:', {
      id: result.id,
      applicationId: result.applicationId,
      scheduledAt: result.scheduledAt,
      type: result.type,
    });

    res.status(HttpStatusCode.CREATED).json(
      buildSuccessResponse(result, Messages.INTERVIEW.SCHEDULED_SUCCESS),
    );
  }

  async getInterviewById(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId ;
    const userRole = req.user?.role ;

    if (!userId || !userRole) {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED,
      );
    }

    const { id } = req.params;
    const result = await this._interviewService.getInterviewById(id);

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(result, Messages.INTERVIEW.RETRIEVED_SUCCESS),
    );
  }

  async updateInterview(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId ;
    const userRole = req.user?.role ;

    if (!userId || (userRole !== 'company' && userRole !== 'jobseeker')) {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED,
      );
    }

    const { id } = req.params;
    const validationResult = UpdateInterviewSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      throw new AppError(
        `${Messages.VALIDATION.VALIDATION_FAILED}: ${validationResult.error.message}`,
        ValidationStatusCode.VALIDATION_ERROR,
      );
    }

    const validatedData = validationResult.data;
    const result = await this._interviewService.updateInterview(id, validatedData, userId);

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(result, Messages.INTERVIEW.UPDATED_SUCCESS),
    );
  }

  async cancelInterview(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId ;
    const userRole = req.user?.role ;

    if (!userId || (userRole !== 'company' && userRole !== 'jobseeker')) {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED,
      );
    }

    const { id } = req.params;
    const { reason } = req.body;
    
    const result = await this._interviewService.cancelInterview(id, userId, reason);

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(result, Messages.INTERVIEW.CANCELLED_SUCCESS),
    );
  }

  async getInterviewsByApplication(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId ;
    const userRole = req.user?.role ;

    if (!userId || !userRole) {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED,
      );
    }

    const { applicationId } = req.params;
    const result = await this._interviewService.getInterviewsByApplication(applicationId);

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(result, Messages.INTERVIEW.RETRIEVED_SUCCESS),
    );
  }

  async getCompanyInterviews(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId ;
    const userRole = req.user?.role ;

    if (!userId || userRole !== 'company') {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED,
      );
    }

    const result = await this._interviewService.getCompanyInterviews(userId);

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(result, Messages.INTERVIEW.RETRIEVED_SUCCESS),
    );
  }

  async getCandidateInterviews(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId ;
    const userRole = req.user?.role;

    if (!userId || userRole !== 'jobseeker') {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED,
      );
    }
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const status = req.query.status as string | undefined;

    const result = await this._interviewService.getCandidateInterviews(userId, page, limit, status);

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({
        interviews: result.interviews,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      }, Messages.INTERVIEW.RETRIEVED_SUCCESS),
    );
  }

  async makeInterviewDecision(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId ;
    const userRole = req.user?.role ;

    if (!userId || userRole !== 'company') {
      throw new AppError(
        Messages.VALIDATION.UNAUTHORIZED_ACCESS,
        HttpStatusCode.UNAUTHORIZED,
      );
    }

    const { id } = req.params;
    const decisionData = req.body;

    const validation = InterviewDecisionSchema.safeParse(decisionData);
    if (!validation.success) {
      throw new AppError(
        `${Messages.VALIDATION.VALIDATION_FAILED}: ${validation.error.issues.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ')}`,
        ValidationStatusCode.VALIDATION_ERROR,
      );
    }

    const result = await this._interviewService.makeInterviewDecision(id, validation.data, userId);

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(result, Messages.INTERVIEW.DECISION_MADE_SUCCESS),
    );
  }

  async getWebRTCConfig(req: Request, res: Response): Promise<void>{
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if(!userId || !userRole){
      throw new AppError(Messages.VALIDATION.UNAUTHORIZED_ACCESS,HttpStatusCode.UNAUTHORIZED);
    }

    const { id: interviewId } = req.params;

    await this._interviewService.getInterviewById(interviewId);

const iceServers: RTCIceServer[] = [];

if (AppConfig.STUN_SERVER_URL) {
  iceServers.push({
    urls: AppConfig.STUN_SERVER_URL,
  });
}

    if (AppConfig.TURN_SERVER_URL) {
      iceServers.push({
        urls: AppConfig.TURN_SERVER_URL,
        username: AppConfig.TURN_USERNAME,
        credential: AppConfig.TURN_CREDENTIAL,
      });
    }

    const webrtcConfig = {
      interviewId: interviewId, 
      roomId: interviewId, 
      signalingServerUrl: AppConfig.CHAT_SERVICE_URL,
      iceServers,
    };

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse(webrtcConfig, Messages.INTERVIEW.WEBRTC_CONFIG_RETRIEVED_SUCCESS),
    );
    
  }
}
