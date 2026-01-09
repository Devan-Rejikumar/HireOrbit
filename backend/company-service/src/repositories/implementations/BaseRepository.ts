import { injectable } from 'inversify';
import { prisma } from '../../prisma/client';
import { PrismaClient } from '@prisma/client';
import { IBaseRepository, PaginationResult } from '../interfaces/IBaseRepository';

interface BaseEntity {
    id: string;
}

// Define the common interface for Prisma delegates
// Using flexible types to match actual Prisma delegate signatures
export interface PrismaDelegate<T> {
    findUnique(args: { where: { id: string }; [key: string]: unknown }): Promise<T | null>;
    findMany(args?: { where?: Record<string, unknown>; skip?: number; take?: number; orderBy?: Record<string, 'asc' | 'desc'>; [key: string]: unknown }): Promise<T[]>;
    findFirst(args?: { where?: Record<string, unknown>; [key: string]: unknown }): Promise<T | null>;
    create(args: { data: unknown; [key: string]: unknown }): Promise<T>;
    update(args: { where: { id: string }; data: unknown; [key: string]: unknown }): Promise<T>;
    delete(args: { where: { id: string }; [key: string]: unknown }): Promise<T>;
    count(args?: { where?: Record<string, unknown>; [key: string]: unknown }): Promise<number>;
}

@injectable()
export abstract class BaseRepository<T extends BaseEntity> implements IBaseRepository<T> {
  protected prisma: PrismaClient;
  constructor() {
    this.prisma = prisma;
  }
    // Return type is now properly typed as PrismaDelegate
    protected abstract getModel(): PrismaDelegate<T>;
    
    async findById(id: string): Promise<T | null> {
      const model = this.getModel();
      return model.findUnique({ where: { id } });
    }

    async findAll(): Promise<T[]> {
      const model = this.getModel();
      return model.findMany();
    }
    
    async create(data: Partial<T>): Promise<T> {
      const model = this.getModel();
      return model.create({ data });
    }
    
    async update(id: string, data: Partial<T>): Promise<T> {
      const model = this.getModel();
      return model.update({
        where: { id }, data,
      });
    }
    
    async delete(id: string): Promise<T> {
      const model = this.getModel();
      return model.delete({ where: { id } });
    }
    
    async findOne(where: Record<string, unknown>): Promise<T | null> {
      const model = this.getModel();
      return model.findFirst({ where });
    }
    
    async findMany(where?: Record<string, unknown>): Promise<T[]> {
      const model = this.getModel();
      return model.findMany({ where });
    }
    
    async count(where?: Record<string, unknown>): Promise<number> {
      const model = this.getModel();
      return model.count({ where });
    }
    
    async findWithPagination(
      page: number = 1,
      limit: number = 10,
      where?: Record<string, unknown>,
      orderBy?: Record<string, 'asc' | 'desc'>,
    ): Promise<PaginationResult<T>> {
      const skip = (page - 1) * limit;
      const model = this.getModel();

      const [data, total] = await Promise.all([
        model.findMany({
          where,
          skip,
          take: limit,
          orderBy,
        }),
        model.count({ where }),
      ]);

      return {
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }
}
