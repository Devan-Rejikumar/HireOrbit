import { injectable } from 'inversify';
import { Skill } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ISkillRepository, PaginatedResult } from '../interfaces/ISkillRepository';

@injectable()
export class SkillRepository implements ISkillRepository {
  async create(name: string, category?: string): Promise<Skill> {
    return prisma.skill.create({
      data: {
        name,
        category: category || null,
      },
    });
  }

  async findAll(includeInactive: boolean = false): Promise<Skill[]> {
    return prisma.skill.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findPaginated(includeInactive: boolean, page: number, limit: number): Promise<PaginatedResult<Skill>> {
    const skip = (page - 1) * limit;
    const where = includeInactive ? {} : { isActive: true };

    const [data, total] = await Promise.all([
      prisma.skill.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.skill.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<Skill | null> {
    return prisma.skill.findUnique({
      where: { id },
    });
  }

  async findByName(name: string): Promise<Skill | null> {
    // Case-insensitive search
    return prisma.skill.findFirst({
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
    data: { name?: string; category?: string; isActive?: boolean },
  ): Promise<Skill> {
    return prisma.skill.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.skill.delete({
      where: { id },
    });
  }
}


