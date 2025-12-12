import { injectable } from 'inversify';
import { Job, PrismaClient, Prisma } from '@prisma/client';
import { IJobRepository } from '../interfaces/IJobRepository';
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
    await this.prisma.job.delete({
      where:{ id },
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

  private _buildWhereClause(filters: JobSearchFilters) {
    const where: Prisma.JobWhereInput = {};
 
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
      where.salary = {};
      if (filters.minSalary) where.salary.gte = filters.minSalary;
      if (filters.maxSalary) where.salary.lte = filters.maxSalary;
    }
    
    return where;
  }

  private _buildOrderBy(filters: JobSearchFilters) {
    const orderBy: Prisma.JobOrderByWithRelationInput = {};
    orderBy[filters.sortBy || 'createdAt'] = filters.sortOrder || 'desc';
    return orderBy;
  }

  async getTotalJobCount(): Promise<number> {
    return this.prisma.job.count({
      where: { isActive: true },
    });
  }

  async getJobStatisticsByTimePeriod(
    startDate: Date, 
    endDate: Date, 
    groupBy: 'day' | 'week' | 'month',
  ): Promise<Array<{ date: string; count: number }>> {
    const jobs = await this.prisma.job.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        isActive: true,
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by time period
    const grouped = new Map<string, number>();
    
    jobs.forEach(job => {
      const date = new Date(job.createdAt);
      let key: string;
      
      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
        weekStart.setHours(0, 0, 0, 0);
        key = weekStart.toISOString().split('T')[0];
      } else { // month
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
      }
      
      grouped.set(key, (grouped.get(key) || 0) + 1);
    });

    // Generate all periods in the range to ensure continuity
    const allPeriods = new Map<string, number>();
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    while (current <= end) {
      let key: string;
      
      if (groupBy === 'day') {
        key = current.toISOString().split('T')[0];
        current.setDate(current.getDate() + 1);
      } else if (groupBy === 'week') {
        const weekStart = new Date(current);
        weekStart.setDate(current.getDate() - current.getDay());
        weekStart.setHours(0, 0, 0, 0);
        key = weekStart.toISOString().split('T')[0];
        current.setDate(current.getDate() + 7);
      } else { // month
        key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        current.setMonth(current.getMonth() + 1);
      }
      
      allPeriods.set(key, grouped.get(key) || 0);
    }

    // Convert to array and sort
    const result = Array.from(allPeriods.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return result;
  }

  async getTopCompaniesByJobCount(limit: number): Promise<Array<{ companyId: string; companyName: string; jobCount: number }>> {
    const jobs = await this.prisma.job.findMany({
      where: {
        isActive: true,
        companyId: { not: null },
      },
      select: {
        companyId: true,
        company: true,
      },
    });

    // Group by company
    const companyMap = new Map<string, { companyId: string; companyName: string; jobCount: number }>();
    
    jobs.forEach(job => {
      const companyId = job.companyId || '';
      const companyName = job.company || 'Unknown Company';
      
      if (companyMap.has(companyId)) {
        companyMap.get(companyId)!.jobCount++;
      } else {
        companyMap.set(companyId, {
          companyId,
          companyName,
          jobCount: 1,
        });
      }
    });

    // Sort by job count and return top N
    return Array.from(companyMap.values())
      .sort((a, b) => b.jobCount - a.jobCount)
      .slice(0, limit);
  }

}