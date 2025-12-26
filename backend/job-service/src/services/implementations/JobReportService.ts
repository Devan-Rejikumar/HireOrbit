import { injectable, inject } from 'inversify';
import TYPES from '../../config/types';
import { IJobReportRepository } from '../../repositories/interfaces/IJobReportRepository';
import { IJobReportService } from '../interfaces/IJobReportService';
import { JobReportResponse, ReportedJobResponse } from '../../dto/responses/job-report.response';
import { JobResponse } from '../../dto/responses/job.response';
import { AppError } from '../../utils/errors/AppError';
import { HttpStatusCode } from '../../enums/StatusCodes';
import { IJobRepository } from '../../repositories/interfaces/IJobRepository';
import { Messages } from '../../constants/Messages';

@injectable()
export class JobReportService implements IJobReportService {
  constructor(
    @inject(TYPES.IJobReportRepository)
    private readonly _jobReportRepository: IJobReportRepository,
    @inject(TYPES.IJobRepository)
    private readonly _jobRepository: IJobRepository,
  ) {}

  async reportJob(jobId: string, userId: string, reason: string): Promise<JobReportResponse> {
    // Check if job exists
    const job = await this._jobRepository.findById(jobId);
    if (!job) {
      throw new AppError(Messages.JOB.JOB_NOT_FOUND, HttpStatusCode.NOT_FOUND);
    }

    console.log('🔍 [DEBUG] Checking for duplicate report:', {
      jobId: jobId,
      userId: userId,
      jobIdType: typeof jobId,
      userIdType: typeof userId,
      jobIdLength: jobId?.length,
      userIdLength: userId?.length,
    });

    const existingReport = await this._jobReportRepository.findByJobIdAndUserId(jobId,userId);
    console.log('🔍 [DEBUG] Existing report result:', {
      found: !!existingReport,
      existingReport: existingReport ? {
        id: existingReport.id,
        jobId: existingReport.jobId,
        userId: existingReport.userId,
        // Check if values match exactly
        jobIdMatches: existingReport.jobId === jobId,
        userIdMatches: existingReport.userId === userId,
        // Check string comparison
        jobIdStrictEqual: existingReport.jobId === jobId,
        userIdStrictEqual: existingReport.userId === userId,
      } : null,
    });
  
    if(existingReport){
      throw new AppError(Messages.JOB.ALREADY_REPORTED, HttpStatusCode.BAD_REQUEST);
    }
    const report = await this._jobReportRepository.create(jobId, userId, reason);

    return {
      id: report.id,
      jobId: report.jobId,
      userId: report.userId,
      reason: report.reason,
      createdAt: report.createdAt,
    };
  }

  async getAllReportedJobs(): Promise<ReportedJobResponse[]> {
    const allReports = await this._jobReportRepository.findAll();

    // Group reports by jobId
    const reportsByJob = new Map<string, JobReportResponse[]>();

    for (const report of allReports) {
      const jobResponse: JobResponse = {
        id: report.job.id,
        title: report.job.title,
        description: report.job.description,
        company: report.job.company,
        companyId: report.job.companyId || undefined,
        location: report.job.location,
        salary: report.job.salary || undefined,
        jobType: report.job.jobType,
        requirements: report.job.requirements,
        benefits: report.job.benefits,
        experienceLevel: report.job.experienceLevel,
        education: report.job.education,
        applicationDeadline: report.job.applicationDeadline,
        workLocation: report.job.workLocation,
        isActive: report.job.isActive,
        isListed: report.job.isListed ?? true,
        listedAt: report.job.listedAt || report.job.createdAt,
        createdAt: report.job.createdAt,
        updatedAt: report.job.updatedAt,
      };

      const reportResponse: JobReportResponse = {
        id: report.id,
        jobId: report.jobId,
        userId: report.userId,
        reason: report.reason,
        createdAt: report.createdAt,
        job: jobResponse,
      };

      if (!reportsByJob.has(report.jobId)) {
        reportsByJob.set(report.jobId, []);
      }
      reportsByJob.get(report.jobId)!.push(reportResponse);
    }

    // Convert to ReportedJobResponse array
    const reportedJobs: ReportedJobResponse[] = [];
    for (const [_jobId, reports] of reportsByJob.entries()) {
      const firstReport = reports[0];
      if (firstReport && firstReport.job) {
        reportedJobs.push({
          job: firstReport.job,
          reports,
          reportCount: reports.length,
        });
      }
    }

    // Sort by most reported first, then by most recent report
    reportedJobs.sort((a, b) => {
      if (b.reportCount !== a.reportCount) {
        return b.reportCount - a.reportCount;
      }
      const aLatest = a.reports[0]?.createdAt || new Date(0);
      const bLatest = b.reports[0]?.createdAt || new Date(0);
      return bLatest.getTime() - aLatest.getTime();
    });

    return reportedJobs;
  }

  async getReportsByJobId(jobId: string): Promise<JobReportResponse[]> {
    const reports = await this._jobReportRepository.findByJobId(jobId);

    return reports.map((report) => ({
      id: report.id,
      jobId: report.jobId,
      userId: report.userId,
      reason: report.reason,
      createdAt: report.createdAt,
    }));
  }
}

