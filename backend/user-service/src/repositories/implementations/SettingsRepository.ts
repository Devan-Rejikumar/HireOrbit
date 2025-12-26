import { injectable } from 'inversify';
import { prisma } from '../../prisma/client';
import { ISettingsRepository } from '../interfaces/ISettingsRepository';

@injectable()
export class SettingsRepository implements ISettingsRepository {
  async getSettings() {
    // Get the first (and should be only) settings record
    // If none exists, return null
    const settings = await prisma.siteSettings.findFirst();
    return settings;
  }

  async updateSettings(data: {
    logoUrl?: string | null;
    companyName?: string | null;
    aboutPage?: string | null;
  }) {
    // Get existing settings or create new one
    const existing = await prisma.siteSettings.findFirst();
    
    if (existing) {
      // Update existing
      return await prisma.siteSettings.update({
        where: { id: existing.id },
        data: {
          ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
          ...(data.companyName !== undefined && { companyName: data.companyName }),
          ...(data.aboutPage !== undefined && { aboutPage: data.aboutPage }),
        },
      });
    } else {
      // Create new
      return await prisma.siteSettings.create({
        data: {
          logoUrl: data.logoUrl || null,
          companyName: data.companyName || 'Hireorbit',
          aboutPage: data.aboutPage || null,
        },
      });
    }
  }
}

