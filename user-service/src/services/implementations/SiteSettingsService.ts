import { injectable, inject } from 'inversify';
import TYPES from '../../config/types';
import { ISiteSettingsService } from '../interfaces/ISiteSettingsService';
import {
  ISiteSettingsRepository,
  IBannerRepository,
  IContentPageRepository,
} from '../../repositories/interfaces/ISiteSettingsRepository';
import cloudinary from '../../config/cloudinary';
import { AppError } from '../../utils/errors/AppError';
import { HttpStatusCode } from '../../enums/StatusCodes';
import { SiteSettings, Banner, ContentPage } from '@prisma/client';

@injectable()
export class SiteSettingsService implements ISiteSettingsService {
  constructor(
    @inject(TYPES.ISiteSettingsRepository) private _siteSettingsRepository: ISiteSettingsRepository,
    @inject(TYPES.IBannerRepository) private _bannerRepository: IBannerRepository,
    @inject(TYPES.IContentPageRepository) private _contentPageRepository: IContentPageRepository,
  ) {}

  async getSettings(): Promise<SiteSettings> {
    const settings = await this._siteSettingsRepository.getSettings();
    if (!settings) {
      return this._siteSettingsRepository.createSettings();
    }
    return settings;
  }

  async updateLogo(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<SiteSettings> {
    try {
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        throw new AppError('Cloudinary configuration is missing.', HttpStatusCode.INTERNAL_SERVER_ERROR);
      }

      const base64String = fileBuffer.toString('base64');
      const dataUri = `data:${mimeType};base64,${base64String}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: 'site-assets',
        resource_type: 'image',
        public_id: `logo_${Date.now()}`,
        overwrite: false,
      });

      if (!result || !result.secure_url) {
        throw new AppError('Failed to upload logo to Cloudinary', HttpStatusCode.INTERNAL_SERVER_ERROR);
      }

      return this._siteSettingsRepository.updateLogo(result.secure_url);
    } catch (error: unknown) {
      const err = error as { message?: string; http_code?: number };
      console.error('[SiteSettingsService] Logo upload error:', err);
      throw new AppError(
        err.message || 'Failed to upload logo',
        err.http_code || HttpStatusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAllBanners(): Promise<Banner[]> {
    return this._bannerRepository.findAll();
  }

  async getActiveBanners(): Promise<Banner[]> {
    return this._bannerRepository.findActive();
  }

  async getBannerById(id: string): Promise<Banner | null> {
    return this._bannerRepository.findById(id);
  }

  async createBanner(data: {
    title: string;
    fileBuffer: Buffer;
    fileName: string;
    mimeType: string;
    linkUrl?: string;
    type: string;
  }): Promise<Banner> {
    try {
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        throw new AppError('Cloudinary configuration is missing.', HttpStatusCode.INTERNAL_SERVER_ERROR);
      }

      const base64String = data.fileBuffer.toString('base64');
      const dataUri = `data:${data.mimeType};base64,${base64String}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: 'site-banners',
        resource_type: 'image',
        public_id: `banner_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        overwrite: false,
      });

      if (!result || !result.secure_url) {
        throw new AppError('Failed to upload banner to Cloudinary', HttpStatusCode.INTERNAL_SERVER_ERROR);
      }

      // Get current max order
      const allBanners = await this._bannerRepository.findAll();
      const maxOrder = allBanners.length > 0 ? Math.max(...allBanners.map(b => b.order)) : -1;

      return this._bannerRepository.create({
        title: data.title,
        imageUrl: result.secure_url,
        linkUrl: data.linkUrl,
        order: maxOrder + 1,
        type: data.type,
      });
    } catch (error: unknown) {
      const err = error as { message?: string; http_code?: number };
      console.error('[SiteSettingsService] Banner upload error:', err);
      throw new AppError(
        err.message || 'Failed to upload banner',
        err.http_code || HttpStatusCode.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async updateBanner(id: string, data: {
    title?: string;
    fileBuffer?: Buffer;
    fileName?: string;
    mimeType?: string;
    linkUrl?: string;
    isActive?: boolean;
    type?: string;
  }): Promise<Banner> {
    const updateData: {
      title?: string;
      imageUrl?: string;
      linkUrl?: string;
      isActive?: boolean;
      type?: string;
    } = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.linkUrl !== undefined) updateData.linkUrl = data.linkUrl;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.type !== undefined) updateData.type = data.type;

    // If new image is provided, upload it
    if (data.fileBuffer && data.fileName && data.mimeType) {
      try {
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
          throw new AppError('Cloudinary configuration is missing.', HttpStatusCode.INTERNAL_SERVER_ERROR);
        }

        const base64String = data.fileBuffer.toString('base64');
        const dataUri = `data:${data.mimeType};base64,${base64String}`;

        const result = await cloudinary.uploader.upload(dataUri, {
          folder: 'site-banners',
          resource_type: 'image',
          public_id: `banner_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          overwrite: false,
        });

        if (!result || !result.secure_url) {
          throw new AppError('Failed to upload banner to Cloudinary', HttpStatusCode.INTERNAL_SERVER_ERROR);
        }

        updateData.imageUrl = result.secure_url;
      } catch (error: unknown) {
        const err = error as { message?: string; http_code?: number };
        console.error('[SiteSettingsService] Banner update upload error:', err);
        throw new AppError(
          err.message || 'Failed to upload banner',
          err.http_code || HttpStatusCode.INTERNAL_SERVER_ERROR,
        );
      }
    }

    return this._bannerRepository.update(id, updateData);
  }

  async deleteBanner(id: string): Promise<void> {
    await this._bannerRepository.delete(id);
  }

  async reorderBanners(ids: string[]): Promise<void> {
    await this._bannerRepository.reorder(ids);
  }

  async getContentPage(slug: string): Promise<ContentPage | null> {
    return this._contentPageRepository.findBySlug(slug);
  }

  async updateContentPage(slug: string, title: string, content: string, updatedBy?: string): Promise<ContentPage> {
    return this._contentPageRepository.createOrUpdate(slug, title, content, updatedBy);
  }
}

