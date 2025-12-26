import { JobPostingLimit } from '@prisma/client';

export interface IJobPostingLimitRepository {
  findByCompanyId(companyId: string): Promise<JobPostingLimit | null>;
  create(data: {
    companyId: string;
    currentCount: number;
    limit: number;
    resetDate: Date;
  }): Promise<JobPostingLimit>;
  update(companyId: string, data: Partial<JobPostingLimit>): Promise<JobPostingLimit>;
  incrementCount(companyId: string): Promise<JobPostingLimit>;
  resetMonthlyLimits(): Promise<void>;
}

