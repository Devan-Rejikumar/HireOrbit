import { SiteSettings, Banner, ContentPage } from '@prisma/client';

export interface ISiteSettingsRepository {
  getSettings(): Promise<SiteSettings | null>;
  updateLogo(logoUrl: string): Promise<SiteSettings>;
  createSettings(): Promise<SiteSettings>;
}

export interface IBannerRepository {
  findAll(): Promise<Banner[]>;
  findActive(): Promise<Banner[]>;
  findById(id: string): Promise<Banner | null>;
  create(data: {
    title: string;
    imageUrl: string;
    linkUrl?: string;
    order: number;
    type: string;
  }): Promise<Banner>;
  update(id: string, data: {
    title?: string;
    imageUrl?: string;
    linkUrl?: string;
    order?: number;
    isActive?: boolean;
    type?: string;
  }): Promise<Banner>;
  delete(id: string): Promise<void>;
  reorder(ids: string[]): Promise<void>;
}

export interface IContentPageRepository {
  findBySlug(slug: string): Promise<ContentPage | null>;
  createOrUpdate(slug: string, title: string, content: string, updatedBy?: string): Promise<ContentPage>;
}

