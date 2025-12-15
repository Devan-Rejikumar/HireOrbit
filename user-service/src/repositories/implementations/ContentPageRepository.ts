import { injectable } from 'inversify';
import { ContentPage } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { IContentPageRepository } from '../interfaces/ISiteSettingsRepository';

@injectable()
export class ContentPageRepository implements IContentPageRepository {
  async findBySlug(slug: string): Promise<ContentPage | null> {
    return prisma.contentPage.findUnique({
      where: { slug },
    });
  }

  async createOrUpdate(slug: string, title: string, content: string, updatedBy?: string): Promise<ContentPage> {
    const existing = await prisma.contentPage.findUnique({
      where: { slug },
    });

    if (existing) {
      return prisma.contentPage.update({
        where: { slug },
        data: {
          title,
          content,
          updatedBy: updatedBy || null,
        },
      });
    }

    return prisma.contentPage.create({
      data: {
        slug,
        title,
        content,
        updatedBy: updatedBy || null,
      },
    });
  }
}

