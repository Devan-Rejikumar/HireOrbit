import { injectable } from 'inversify';
import { Banner } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { IBannerRepository } from '../interfaces/ISiteSettingsRepository';

@injectable()
export class BannerRepository implements IBannerRepository {
  async findAll(): Promise<Banner[]> {
    return prisma.banner.findMany({
      orderBy: { order: 'asc' },
    });
  }

  async findActive(): Promise<Banner[]> {
    return prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  async findById(id: string): Promise<Banner | null> {
    return prisma.banner.findUnique({
      where: { id },
    });
  }

  async create(data: {
    title: string;
    imageUrl: string;
    linkUrl?: string;
    order: number;
    type: string;
  }): Promise<Banner> {
    return prisma.banner.create({
      data: {
        title: data.title,
        imageUrl: data.imageUrl,
        linkUrl: data.linkUrl || null,
        order: data.order,
        type: data.type,
        isActive: true,
      },
    });
  }

  async update(id: string, data: {
    title?: string;
    imageUrl?: string;
    linkUrl?: string;
    order?: number;
    isActive?: boolean;
    type?: string;
  }): Promise<Banner> {
    return prisma.banner.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
        ...(data.linkUrl !== undefined && { linkUrl: data.linkUrl }),
        ...(data.order !== undefined && { order: data.order }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.type !== undefined && { type: data.type }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.banner.delete({
      where: { id },
    });
  }

  async reorder(ids: string[]): Promise<void> {
    await Promise.all(
      ids.map((id, index) =>
        prisma.banner.update({
          where: { id },
          data: { order: index },
        })
      )
    );
  }
}

