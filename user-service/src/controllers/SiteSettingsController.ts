import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import TYPES from '../config/types';
import { ISiteSettingsService } from '../services/interfaces/ISiteSettingsService';
import { buildSuccessResponse, buildErrorResponse } from 'shared-dto';
import { HttpStatusCode } from '../enums/StatusCodes';
import { AppError } from '../utils/errors/AppError';
import { getUserIdFromRequest } from '../utils/requestHelpers';

@injectable()
export class SiteSettingsController {
  constructor(
    @inject(TYPES.ISiteSettingsService) private _siteSettingsService: ISiteSettingsService,
  ) {}

  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const settings = await this._siteSettingsService.getSettings();
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse({ settings }, 'Settings retrieved successfully'),
      );
    } catch (error: unknown) {
      const err = error as { message?: string };
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(err.message || 'Failed to retrieve settings'),
      );
    }
  }

  async updateLogo(req: Request, res: Response): Promise<void> {
    try {
      if (!req.body || !req.body.logo) {
        throw new AppError('Logo data is required', HttpStatusCode.BAD_REQUEST);
      }

      const logoData = req.body.logo;

      if (typeof logoData !== 'string' || !logoData.startsWith('data:')) {
        throw new AppError('Invalid logo format. Expected base64 data URI', HttpStatusCode.BAD_REQUEST);
      }

      const [header, base64Data] = logoData.split(',');
      if (!header || !base64Data) {
        throw new AppError('Invalid logo format', HttpStatusCode.BAD_REQUEST);
      }

      const mimeTypeMatch = header.match(/data:([^;]+)/);
      if (!mimeTypeMatch) {
        throw new AppError('Invalid logo format', HttpStatusCode.BAD_REQUEST);
      }

      const mimeType = mimeTypeMatch[1];
      const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
      if (!allowedMimeTypes.includes(mimeType)) {
        throw new AppError('Invalid file type. Only PNG, JPEG, SVG, and WebP images are allowed.', HttpStatusCode.BAD_REQUEST);
      }

      let buffer: Buffer;
      try {
        buffer = Buffer.from(base64Data, 'base64');
      } catch {
        throw new AppError('Invalid base64 data', HttpStatusCode.BAD_REQUEST);
      }

      const maxSize = 2 * 1024 * 1024; // 2MB
      if (buffer.length > maxSize) {
        throw new AppError('File size exceeds 2MB limit', HttpStatusCode.BAD_REQUEST);
      }

      const extension = mimeType.split('/')[1].split('+')[0];
      const fileName = `logo.${extension}`;

      const settings = await this._siteSettingsService.updateLogo(buffer, fileName, mimeType);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse({ settings }, 'Logo updated successfully'),
      );
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (error instanceof AppError) {
        res.status(error.statusCode).json(buildErrorResponse(error.message));
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
          buildErrorResponse(err.message || 'Failed to update logo'),
        );
      }
    }
  }

  async getAllBanners(req: Request, res: Response): Promise<void> {
    try {
      const banners = await this._siteSettingsService.getAllBanners();
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse({ banners }, 'Banners retrieved successfully'),
      );
    } catch (error: unknown) {
      const err = error as { message?: string };
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(err.message || 'Failed to retrieve banners'),
      );
    }
  }

  async getActiveBanners(req: Request, res: Response): Promise<void> {
    try {
      const banners = await this._siteSettingsService.getActiveBanners();
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse({ banners }, 'Active banners retrieved successfully'),
      );
    } catch (error: unknown) {
      const err = error as { message?: string };
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(err.message || 'Failed to retrieve banners'),
      );
    }
  }

  async getBannerById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const banner = await this._siteSettingsService.getBannerById(id);
      
      if (!banner) {
        throw new AppError('Banner not found', HttpStatusCode.NOT_FOUND);
      }

      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse({ banner }, 'Banner retrieved successfully'),
      );
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (error instanceof AppError) {
        res.status(error.statusCode).json(buildErrorResponse(error.message));
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
          buildErrorResponse(err.message || 'Failed to retrieve banner'),
        );
      }
    }
  }

  async createBanner(req: Request, res: Response): Promise<void> {
    try {
      const { title, linkUrl, type } = req.body;

      if (!title || !req.body.image) {
        throw new AppError('Title and image are required', HttpStatusCode.BAD_REQUEST);
      }

      const imageData = req.body.image;

      if (typeof imageData !== 'string' || !imageData.startsWith('data:')) {
        throw new AppError('Invalid image format. Expected base64 data URI', HttpStatusCode.BAD_REQUEST);
      }

      const [header, base64Data] = imageData.split(',');
      if (!header || !base64Data) {
        throw new AppError('Invalid image format', HttpStatusCode.BAD_REQUEST);
      }

      const mimeTypeMatch = header.match(/data:([^;]+)/);
      if (!mimeTypeMatch) {
        throw new AppError('Invalid image format', HttpStatusCode.BAD_REQUEST);
      }

      const mimeType = mimeTypeMatch[1];
      const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!allowedMimeTypes.includes(mimeType)) {
        throw new AppError('Invalid file type. Only PNG, JPEG, and WebP images are allowed.', HttpStatusCode.BAD_REQUEST);
      }

      let buffer: Buffer;
      try {
        buffer = Buffer.from(base64Data, 'base64');
      } catch {
        throw new AppError('Invalid base64 data', HttpStatusCode.BAD_REQUEST);
      }

      const maxSize = 5 * 1024 * 1024; // 5MB
      if (buffer.length > maxSize) {
        throw new AppError('File size exceeds 5MB limit', HttpStatusCode.BAD_REQUEST);
      }

      const extension = mimeType.split('/')[1];
      const fileName = `banner_${Date.now()}.${extension}`;

      const banner = await this._siteSettingsService.createBanner({
        title,
        fileBuffer: buffer,
        fileName,
        mimeType,
        linkUrl: linkUrl || undefined,
        type: type || 'promotion',
      });

      res.status(HttpStatusCode.CREATED).json(
        buildSuccessResponse({ banner }, 'Banner created successfully'),
      );
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (error instanceof AppError) {
        res.status(error.statusCode).json(buildErrorResponse(error.message));
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
          buildErrorResponse(err.message || 'Failed to create banner'),
        );
      }
    }
  }

  async updateBanner(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, linkUrl, isActive, type } = req.body;

      const updateData: {
        title?: string;
        fileBuffer?: Buffer;
        fileName?: string;
        mimeType?: string;
        linkUrl?: string;
        isActive?: boolean;
        type?: string;
      } = {};

      if (title !== undefined) updateData.title = title;
      if (linkUrl !== undefined) updateData.linkUrl = linkUrl;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (type !== undefined) updateData.type = type;

      // Handle image update if provided
      if (req.body.image) {
        const imageData = req.body.image;

        if (typeof imageData !== 'string' || !imageData.startsWith('data:')) {
          throw new AppError('Invalid image format. Expected base64 data URI', HttpStatusCode.BAD_REQUEST);
        }

        const [header, base64Data] = imageData.split(',');
        if (!header || !base64Data) {
          throw new AppError('Invalid image format', HttpStatusCode.BAD_REQUEST);
        }

        const mimeTypeMatch = header.match(/data:([^;]+)/);
        if (!mimeTypeMatch) {
          throw new AppError('Invalid image format', HttpStatusCode.BAD_REQUEST);
        }

        const mimeType = mimeTypeMatch[1];
        const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!allowedMimeTypes.includes(mimeType)) {
          throw new AppError('Invalid file type. Only PNG, JPEG, and WebP images are allowed.', HttpStatusCode.BAD_REQUEST);
        }

        let buffer: Buffer;
        try {
          buffer = Buffer.from(base64Data, 'base64');
        } catch {
          throw new AppError('Invalid base64 data', HttpStatusCode.BAD_REQUEST);
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (buffer.length > maxSize) {
          throw new AppError('File size exceeds 5MB limit', HttpStatusCode.BAD_REQUEST);
        }

        const extension = mimeType.split('/')[1];
        updateData.fileName = `banner_${Date.now()}.${extension}`;
        updateData.fileBuffer = buffer;
        updateData.mimeType = mimeType;
      }

      const banner = await this._siteSettingsService.updateBanner(id, updateData);

      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse({ banner }, 'Banner updated successfully'),
      );
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (error instanceof AppError) {
        res.status(error.statusCode).json(buildErrorResponse(error.message));
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
          buildErrorResponse(err.message || 'Failed to update banner'),
        );
      }
    }
  }

  async deleteBanner(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this._siteSettingsService.deleteBanner(id);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(null, 'Banner deleted successfully'),
      );
    } catch (error: unknown) {
      const err = error as { message?: string };
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(err.message || 'Failed to delete banner'),
      );
    }
  }

  async reorderBanners(req: Request, res: Response): Promise<void> {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids)) {
        throw new AppError('ids must be an array', HttpStatusCode.BAD_REQUEST);
      }

      await this._siteSettingsService.reorderBanners(ids);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(null, 'Banners reordered successfully'),
      );
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (error instanceof AppError) {
        res.status(error.statusCode).json(buildErrorResponse(error.message));
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
          buildErrorResponse(err.message || 'Failed to reorder banners'),
        );
      }
    }
  }

  async getContentPage(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      let page = await this._siteSettingsService.getContentPage(slug);
      
      // If page doesn't exist, create a default one
      if (!page) {
        const defaultContent: { [key: string]: { title: string; content: string } } = {
          about: {
            title: 'About Us',
            content: '<p>Welcome to HireOrbit! We are dedicated to connecting talented professionals with amazing opportunities.</p>',
          },
          help: {
            title: 'Help & Support',
            content: '<p>Need help? Contact our support team or check out our FAQ section.</p>',
          },
        };
        
        const defaultData = defaultContent[slug] || {
          title: 'Page',
          content: '<p>Content coming soon...</p>',
        };
        
        page = await this._siteSettingsService.updateContentPage(
          slug,
          defaultData.title,
          defaultData.content,
        );
      }

      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse({ page }, 'Content page retrieved successfully'),
      );
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (error instanceof AppError) {
        res.status(error.statusCode).json(buildErrorResponse(error.message));
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
          buildErrorResponse(err.message || 'Failed to retrieve content page'),
        );
      }
    }
  }

  async updateContentPage(req: Request, res: Response): Promise<void> {
    try {
      const { slug } = req.params;
      const { title, content } = req.body;

      if (!title || !content) {
        throw new AppError('Title and content are required', HttpStatusCode.BAD_REQUEST);
      }

      const userId = getUserIdFromRequest(req, res);
      const page = await this._siteSettingsService.updateContentPage(
        slug,
        title,
        content,
        userId || undefined,
      );

      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse({ page }, 'Content page updated successfully'),
      );
    } catch (error: unknown) {
      const err = error as { message?: string };
      if (error instanceof AppError) {
        res.status(error.statusCode).json(buildErrorResponse(error.message));
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
          buildErrorResponse(err.message || 'Failed to update content page'),
        );
      }
    }
  }
}

