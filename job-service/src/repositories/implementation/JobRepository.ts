import { injectable } from 'inversify';
import { Job, PrismaClient } from '@prisma/client';
import { IJobRepository } from '../interface/IJobRepository';
import { JobSearchFilters } from '../../types/job';

@injectable()
export class JobRepository implements IJobRepository {
  private readonly prisma = new PrismaClient();

  async create(jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job> {
    return this.prisma.job.create({ data: jobData });
  }

  async findById(id: string): Promise<Job | null> {
    return this.prisma.job.findUnique({ where: { id } });
  }

  async findAll(): Promise<Job[]> {
    return this.prisma.job.findMany({ 
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByCompany(companyId: string): Promise<Job[]> {
    return this.prisma.job.findMany({
      where: { 
        OR: [
          { companyId: companyId },
          { company: companyId },
        ],
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async search(filters: JobSearchFilters): Promise<Job[]> {
    const where = this._buildWhereClause(filters);
    const orderBy = this._buildOrderBy(filters);
    const skip = ((filters.page || 1) - 1) * (filters.limit || 10);
    const take = filters.limit || 10;

    return this.prisma.job.findMany({
      where,
      orderBy,
      skip,
      take,
    });
  }

  async count(filters: JobSearchFilters): Promise<number> {
    const where = this._buildWhereClause(filters);
    return this.prisma.job.count({ where });
  }

  async update(id: string, data: Partial<Job>): Promise<Job> {
    return this.prisma.job.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.job.update({ 
      where: { id }, 
      data: { isActive: false },
    });
  }

  async countByCompany(companyId: string): Promise<number> {
    return this.prisma.job.count({ 
      where: { companyId, isActive: true },
    });
  }

  async getSuggestions(query: string, limit: number): Promise<string[]> {
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
    return jobs.map(job => job.title);
  }

  private _buildWhereClause(filters: JobSearchFilters): Record<string, unknown> {
    const where: Record<string, unknown> = {};
 
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    
    if (filters.title) where.title = { contains: filters.title, mode: 'insensitive' };
    if (filters.company) where.company = { contains: filters.company, mode: 'insensitive' };
    if (filters.companyId) where.companyId = filters.companyId;
    if (filters.location) where.location = { contains: filters.location, mode: 'insensitive' };
    if (filters.jobType) where.jobType = filters.jobType;
    if (filters.experienceLevel) where.experienceLevel = filters.experienceLevel;
    if (filters.education) where.education = filters.education;
    if (filters.workLocation) where.workLocation = filters.workLocation;
    
    if (filters.minSalary || filters.maxSalary) {
      where.salary = {
        ...(filters.minSalary && { gte: filters.minSalary }),
        ...(filters.maxSalary && { lte: filters.maxSalary }),
      };
    }
    
    return where;
  }

  private _buildOrderBy(filters: JobSearchFilters): Record<string, string> {
    const orderBy: Record<string, string> = {};
    orderBy[filters.sortBy || 'createdAt'] = filters.sortOrder || 'desc';
    return orderBy;
  }
}