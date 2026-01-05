import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import TYPES from '../config/types';
import { IJobReportService } from '../services/interfaces/IJobReportService';
import { ReportJobSchema } from '../dto/schemas/job-report.schema';
import { buildSuccessResponse } from 'hireorbit-shared-dto';
import { AppError } from '../utils/errors/AppError';
import { HttpStatusCode } from '../enums/StatusCodes';
import { ValidationStatusCode } from '../enums/StatusCodes';
import { Messages } from '../constants/Messages';
import '../types/express';

@injectable()
export class JobReportController {
  constructor(
    @inject(TYPES.IJobReportService)
    private readonly _jobReportService: IJobReportService,
  ) {}

  async reportJob(req: Request, res: Response): Promise<void> {
    const { jobId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError(
        Messages.VALIDATION.AUTHENTICATION_REQUIRED || 'User not authenticated',
        HttpStatusCode.UNAUTHORIZED,
      );
    }

    if (!jobId) {
      throw new AppError(
        Messages.VALIDATION.MISSING_JOB_ID || 'Job ID is required',
        ValidationStatusCode.MISSING_REQUIRED_FIELDS,
      );
    }

    const validationResult = ReportJobSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new AppError(
        `${Messages.VALIDATION.VALIDATION_FAILED || 'Validation failed'}: ${validationResult.error.message}`,
        ValidationStatusCode.VALIDATION_ERROR,
      );
    }

    const report = await this._jobReportService.reportJob(jobId, userId, validationResult.data.reason);

    res.status(HttpStatusCode.CREATED).json(
      buildSuccessResponse({ report }, 'Job reported successfully'),
    );
  }

  async getReportedJobs(req: Request, res: Response): Promise<void> {
    const userRole = req.user?.role;
    if (userRole !== 'admin') {
      throw new AppError(
        'Admin access required',
        HttpStatusCode.FORBIDDEN,
      );
    }

    const reportedJobs = await this._jobReportService.getAllReportedJobs();

    res.status(HttpStatusCode.OK).json(
      buildSuccessResponse({ reportedJobs }, 'Reported jobs retrieved successfully'),
    );
  }
}

