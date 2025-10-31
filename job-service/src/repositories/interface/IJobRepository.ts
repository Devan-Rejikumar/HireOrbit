import { Job } from '@prisma/client';
import { JobSearchFilters } from '../../types/job';

export interface IJobRepository {
  create(jobData: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job>;
  findById(id: string): Promise<Job | null>;
  findAll(): Promise<Job[]>;
  findByCompany(companyId: string): Promise<Job[]>;
  search(filters: JobSearchFilters): Promise<Job[]>;
  update(id: string, data: Partial<Job>): Promise<Job>;
  delete(id: string): Promise<void>;
  countByCompany(companyId: string): Promise<number>;
  getSuggestions(query: string, limit: number): Promise<string[]>;
}