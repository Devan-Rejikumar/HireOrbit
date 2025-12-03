import { injectable } from 'inversify';
import { prisma } from '../../prisma/client';
import { JobPostingLimit } from '@prisma/client';
import { IJobPostingLimitRepository } from '../interfaces/IJobPostingLimitRepository';

@injectable()
export class JobPostingLimitRepository implements IJobPostingLimitRepository {
  async findByCompanyId(companyId: string): Promise<JobPostingLimit | null> {
    return prisma.jobPostingLimit.findUnique({
      where: { companyId },
    });
  }

  async create(data: {
    companyId: string;
    currentCount: number;
    limit: number;
    resetDate: Date;
  }): Promise<JobPostingLimit> {
    return prisma.jobPostingLimit.create({
      data,
    });
  }

  async update(companyId: string, data: Partial<JobPostingLimit>): Promise<JobPostingLimit> {
    return prisma.jobPostingLimit.update({
      where: { companyId },
      data,
    });
  }

  async incrementCount(companyId: string): Promise<JobPostingLimit> {
    return prisma.jobPostingLimit.update({
      where: { companyId },
      data: {
        currentCount: { increment: 1 },
      },
    });
  }

  async resetMonthlyLimits(): Promise<void> {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    await prisma.jobPostingLimit.updateMany({
      where: {
        resetDate: { lte: now },
      },
      data: {
        currentCount: 0,
        resetDate: nextMonth,
      },
    });
  }
}

