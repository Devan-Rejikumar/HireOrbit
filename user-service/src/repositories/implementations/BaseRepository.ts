import { injectable } from 'inversify';
import { prisma } from '../../prisma/client';
import { PrismaClient } from '@prisma/client';
import { IBaseRepository, PaginationResult } from '../../interfaces/IBaseRepository';
import { BaseEntity } from '../../types/base';

@injectable()
export abstract class BaseRepository<T extends BaseEntity> implements IBaseRepository<T>{
  protected _prisma: PrismaClient;
  constructor(){
    this._prisma = prisma;
  }
    protected abstract _getModel(): {
      findUnique: (args: { where: { id: string } }) => Promise<T | null>;
      findMany: (args?: { where?: Record<string, unknown>; skip?: number; take?: number; orderBy?: Record<string, unknown> }) => Promise<T[]>;
      create: (args: { data: Partial<T> }) => Promise<T>;
      update: (args: { where: { id: string }; data: Partial<T> }) => Promise<T>;
      delete: (args: { where: { id: string } }) => Promise<T>;
      findFirst: (args: { where: Record<string, unknown> }) => Promise<T | null>;
      count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
    };
    async findById(id: string): Promise<T | null>{
      const model = this._getModel();
      return model.findUnique({where:{id}});
    }
     
    async findAll(): Promise<T[]>{
      const model = this._getModel();
      return model.findMany();
    }
    async create(data: Partial<T>): Promise<T> {
      const model = this._getModel();
      return model.create({data});
    }
    async update(id: string, data: Partial<T>): Promise<T> {
      const model = this._getModel();
      return model.update({
        where:{id},data
      });
    }
    async delete(id: string): Promise<T> {
      const model = this._getModel();
      return model.delete({where:{id}});
    }
    async findOne(where: Record<string, unknown>): Promise<T | null> {
      const model = this._getModel();
      return model.findFirst({where});
    }
    async findMany(where?: Record<string, unknown>): Promise<T[]> {
      const model = this._getModel();
      return model.findMany({where});
    }
    async count(where?: Record<string, unknown>): Promise<number> {
      const model = this._getModel();
      return model.count({where});
    }
    async findWithPagination(
      page: number = 1,
      limit: number = 10,
      where?: Record<string, unknown>,
      orderBy?: Record<string, unknown>
    ): Promise<PaginationResult<T>> {
      const skip = (page - 1) * limit;
      const model = this._getModel();
    
      const [data, total] = await Promise.all([
        model.findMany({
          where,
          skip,
          take: limit,
          orderBy
        }),
        model.count({ where })
      ]);

      return {
        data,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    }
}