import { SiteSettings, Banner, ContentPage } from '@prisma/client';

export interface ISiteSettingsService {
  getSettings(): Promise<SiteSettings>;
  updateLogo(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<SiteSettings>;
  getAllBanners(): Promise<Banner[]>;
  getActiveBanners(): Promise<Banner[]>;
  getBannerById(id: string): Promise<Banner | null>;
  createBanner(data: {
    title: string;
    fileBuffer: Buffer;
    fileName: string;
    mimeType: string;
    linkUrl?: string;
    type: string;
  }): Promise<Banner>;
  updateBanner(id: string, data: {
    title?: string;
    fileBuffer?: Buffer;
    fileName?: string;
    mimeType?: string;
    linkUrl?: string;
    isActive?: boolean;
    type?: string;
  }): Promise<Banner>;
  deleteBanner(id: string): Promise<void>;
  reorderBanners(ids: string[]): Promise<void>;
  getContentPage(slug: string): Promise<ContentPage | null>;
  updateContentPage(slug: string, title: string, content: string, updatedBy?: string): Promise<ContentPage>;
}

