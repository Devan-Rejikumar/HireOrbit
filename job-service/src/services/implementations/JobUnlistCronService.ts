import { injectable, inject } from 'inversify';
import { IJobRepository } from '../../repositories/interfaces/IJobRepository';
import TYPES from '../../config/types';
import { logger } from '../../utils/logger';
import { PrismaClient } from '@prisma/client';

@injectable()
export class JobUnlistCronService {
  private readonly prisma = new PrismaClient();

  constructor(
    @inject(TYPES.IJobRepository) private _jobRepository: IJobRepository,
  ) {}

  async unlistExpiredJobs(): Promise<void> {
    try {
      const now = new Date();
      
      // Calculate date 1 calendar month ago
      // Handle month-end edge cases (e.g., Jan 31 -> Feb 28/29)
      const oneMonthAgo = new Date(now);
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      
      // If the day doesn't exist in the previous month (e.g., Jan 31 -> Feb 31 doesn't exist),
      // set to the last day of the previous month
      if (oneMonthAgo.getDate() !== now.getDate()) {
        oneMonthAgo.setDate(0); // Sets to last day of previous month
      }

      // Find jobs that are listed and were listed 1 calendar month or more ago
      const expiredJobs = await this.prisma.job.findMany({
        where: {
          isListed: true,
          listedAt: {
            lte: oneMonthAgo,
          },
        },
        select: {
          id: true,
          title: true,
          companyId: true,
        },
      });

      if (expiredJobs.length === 0) {
        logger.info('No expired jobs to unlist');
        return;
      }

      // Unlist all expired jobs
      const result = await this.prisma.job.updateMany({
        where: {
          id: {
            in: expiredJobs.map(job => job.id),
          },
        },
        data: {
          isListed: false,
        },
      });

      logger.info(`Successfully unlisted ${result.count} expired job(s)`, {
        jobIds: expiredJobs.map(job => job.id),
      });
    } catch (error) {
      logger.error('Error in unlistExpiredJobs cron job:', error);
      throw error;
    }
  }
}

