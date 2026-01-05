import { injectable } from 'inversify';
import { IndustryCategory } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { IIndustryCategoryRepository } from '../interfaces/IIndustryCategoryRepository';

@injectable()
export class IndustryCategoryRepository implements IIndustryCategoryRepository {
  async create(name: string): Promise<IndustryCategory> {
    return prisma.industryCategory.create({
      data: {
        name,
      },
    });
  }

  async findAll(includeInactive: boolean = false): Promise<IndustryCategory[]> {
    return prisma.industryCategory.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<IndustryCategory | null> {
    return prisma.industryCategory.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<IndustryCategory | null> {
    return prisma.industryCategory.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });
  }

  async update(
    id: string,
    data: { name?: string; isActive?: boolean },
  ): Promise<IndustryCategory> {
    return prisma.industryCategory.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.industryCategory.delete({
      where: { id },
    });
  }
}

