import { injectable } from 'inversify';
import { SiteSettings } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { ISiteSettingsRepository } from '../interfaces/ISiteSettingsRepository';

@injectable()
export class SiteSettingsRepository implements ISiteSettingsRepository {
  async getSettings(): Promise<SiteSettings | null> {
    let settings = await prisma.siteSettings.findFirst();
    
    // If no settings exist, create default one
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: {},
      });
    }
    
    return settings;
  }

  async updateLogo(logoUrl: string): Promise<SiteSettings> {
    let settings = await prisma.siteSettings.findFirst();
    
    if (!settings) {
      return prisma.siteSettings.create({
        data: { logoUrl },
      });
    }
    
    return prisma.siteSettings.update({
      where: { id: settings.id },
      data: { logoUrl },
    });
  }

  async createSettings(): Promise<SiteSettings> {
    return prisma.siteSettings.create({
      data: {},
    });
  }
}

