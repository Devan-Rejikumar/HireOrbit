import { injectable } from 'inversify';
import { Job, PrismaClient, Prisma } from '@prisma/client';
import { IJobRepository } from './IJobRepository';
import { JobSearchFilters } from '../types/job';
import { UpdateJobInput } from '../services/IJobService';

@injectable()
export class JobRepository implements IJobRepository {
  private readonly prisma = new PrismaClient();

  async createJob(
    jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Job> {
    return this.prisma.job.create({
      data: jobData,
    });
  }

  async getJobById(jobId: string): Promise<Job | null> {
    return this.prisma.job.findUnique({
      where: { id: jobId },
    });
  }

  async getAllJobs(): Promise<Job[]> {
    console.log('🔍 [JobRepository] getAllJobs called');
    const results = await this.prisma.job.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    console.log('🔍 [JobRepository] Total jobs in database:', results.length);
    console.log('🔍 [JobRepository] Job titles:', results.map(job => job.title));
    return results;
  }

  async searchJobs(filters: JobSearchFilters): Promise<Job[]> {
    console.log('🔍 [JobRepository] searchJobs called with filters:', filters);
    const skip = ((filters.page || 1) - 1) * (filters.limit || 10);
    const take = filters.limit || 10;
    const orderBy: Prisma.JobOrderByWithRelationInput = {};
    orderBy[filters.sortBy || 'createdAt'] = filters.sortOrder || 'desc';
    const whereClause: Prisma.JobWhereInput = { isActive: true };
    const searchTerm = filters.title || filters.query;
    if (searchTerm) {
      whereClause.title = { contains: searchTerm, mode: 'insensitive' };
      console.log('🔍 [JobRepository] Searching for title containing:', searchTerm);
    }
    if (filters.company) {
      whereClause.company = { contains: filters.company, mode: 'insensitive' };
    }
    if (filters.location) {
      whereClause.location = { contains: filters.location, mode: 'insensitive' };
    }

    if (filters.jobType) {
      whereClause.jobType = { equals: filters.jobType, mode: 'insensitive' };
    }
    if (filters.experienceLevel) {
      whereClause.experienceLevel = filters.experienceLevel;
    }
    if (filters.education) {
      whereClause.education = filters.education;
    }
    if (filters.workLocation) {
      whereClause.workLocation = filters.workLocation;
    }
    if (filters.minSalary || filters.maxSalary) {
      whereClause.salary = {};
      if (filters.minSalary) {
        whereClause.salary.gte = filters.minSalary;
      }
      if (filters.maxSalary) {
        whereClause.salary.lte = filters.maxSalary;
      }
    }

    console.log('🔍 [JobRepository] Where clause:', JSON.stringify(whereClause, null, 2));
    
    const results = await this.prisma.job.findMany({
      where: whereClause,
      orderBy,
      skip,
      take,
    });
    
    console.log('🔍 [JobRepository] Search results count:', results.length);
    console.log('🔍 [JobRepository] Search results:', results.map(job => ({ id: job.id, title: job.title, company: job.company })));
    
    return results;
  }

  async getJobsByCompany(companyId: string): Promise<Job[]> {
    return this.prisma.job.findMany({
      where: { company: companyId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateJob(id: string, jobData: UpdateJobInput): Promise<Job> {
    return this.prisma.job.update({
      where: { id },
      data: jobData,
    });
  }

  async deleteJob(id: string): Promise<void> {
    await this.prisma.job.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async countByCompany(companyId: string): Promise<number> {
    console.log('JobRepository: countByCompany called with companyId =', companyId);
    const count = await this.prisma.job.count({
      where: { company: companyId, isActive: true },
    });
    console.log('🔍 JobRepository: count =', count);
    return count;
  }

  async getJobSuggestions(query: string, limit: number = 10): Promise<string[]> {
    const jobs = await this.prisma.job.findMany({
      where: {
        isActive: true,
        title: { contains: query, mode: 'insensitive' },
      },
      select: { title: true },
      distinct: ['title'],
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return jobs.map((job) => job.title);
  }
}