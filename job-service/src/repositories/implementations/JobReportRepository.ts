import { injectable } from 'inversify';
import { JobReport, PrismaClient } from '@prisma/client';
import { IJobReportRepository, JobReportWithJob } from '../interfaces/IJobReportRepository';

@injectable()
export class JobReportRepository implements IJobReportRepository {
  private readonly prisma = new PrismaClient();

  async create(jobId: string, userId: string, reason: string) {
    return this.prisma.jobReport.create({
      data: {
        jobId,
        userId,
        reason,
      },
    });
  }

  async findAll(): Promise<JobReportWithJob[]> {
    return this.prisma.jobReport.findMany({
      include: {
        job: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByJobId(jobId: string): Promise<JobReportWithJob[]> {
    return this.prisma.jobReport.findMany({
      where: { jobId },
      include: {
        job: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByUserId(userId: string): Promise<JobReportWithJob[]> {
    return this.prisma.jobReport.findMany({
      where: { userId },
      include: {
        job: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async deleteByJobId(jobId: string): Promise<void> {
    await this.prisma.jobReport.deleteMany({
      where: { jobId },
    });
  }

  async findByJobIdAndUserId(jobId: string, userId: string): Promise<JobReport | null> {
    return await this.prisma.jobReport.findFirst({
        where:{
            jobId,
            userId
        }
    })
}
}