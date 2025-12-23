import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import TYPES from '../config/types';
import { ISettingsService } from '../services/interfaces/ISettingsService';
import { buildSuccessResponse, buildErrorResponse } from 'shared-dto';
import { HttpStatusCode } from '../enums/StatusCodes';
import { AppError } from '../utils/errors/AppError';
import { v2 as cloudinary } from 'cloudinary';

@injectable()
export class SettingsController {
  constructor(
    @inject(TYPES.ISettingsService) private _settingsService: ISettingsService
  ) {}

  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const settings = await this._settingsService.getSettings();
      
      // If no settings exist, return default values
      if (!settings) {
        res.status(HttpStatusCode.OK).json(
          buildSuccessResponse(
            {
              logoUrl: null,
              companyName: 'Hireorbit',
              aboutPage: null,
            },
            'Settings retrieved successfully'
          )
        );
        return;
      }

      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(settings, 'Settings retrieved successfully')
      );
    } catch (error: unknown) {
      const err = error as Error;
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(err.message || 'Failed to retrieve settings')
      );
    }
  }

  async updateLogo(req: Request, res: Response): Promise<void> {
    try {
      if (!req.body || !req.body.logo) {
        throw new AppError('Logo data is required', HttpStatusCode.BAD_REQUEST);
      }

      const logoData = req.body.logo;

      // Handle base64 data URI
      if (typeof logoData === 'string' && logoData.startsWith('data:image/')) {
        try {
          const result = await cloudinary.uploader.upload(logoData, {
            folder: 'site-branding',
            resource_type: 'image',
            transformation: [
              { width: 500, height: 500, crop: 'limit' },
              { quality: 'auto' }
            ],
          });

          const updatedSettings = await this._settingsService.updateLogo(result.secure_url);
          
          res.status(HttpStatusCode.OK).json(
            buildSuccessResponse(updatedSettings, 'Logo updated successfully')
          );
        } catch (cloudinaryError) {
          console.error('[SettingsController] Cloudinary upload error:', cloudinaryError);
          throw new AppError('Failed to upload logo', HttpStatusCode.INTERNAL_SERVER_ERROR);
        }
      } else if (typeof logoData === 'string' && logoData.startsWith('http')) {
        // If it's already a URL, just save it
        const updatedSettings = await this._settingsService.updateLogo(logoData);
        
        res.status(HttpStatusCode.OK).json(
          buildSuccessResponse(updatedSettings, 'Logo updated successfully')
        );
      } else {
        throw new AppError('Invalid logo format. Expected base64 data URI or URL', HttpStatusCode.BAD_REQUEST);
      }
    } catch (error: unknown) {
      const err = error as Error;
      res.status(err instanceof AppError ? err.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(err.message || 'Failed to update logo')
      );
    }
  }

  async updateCompanyName(req: Request, res: Response): Promise<void> {
    try {
      if (!req.body || !req.body.companyName) {
        throw new AppError('Company name is required', HttpStatusCode.BAD_REQUEST);
      }

      const { companyName } = req.body;
      const updatedSettings = await this._settingsService.updateCompanyName(companyName);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(updatedSettings, 'Company name updated successfully')
      );
    } catch (error: unknown) {
      const err = error as Error;
      res.status(err instanceof AppError ? err.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(err.message || 'Failed to update company name')
      );
    }
  }

  async updateAboutPage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.body || req.body.aboutPage === undefined) {
        throw new AppError('About page content is required', HttpStatusCode.BAD_REQUEST);
      }

      const { aboutPage } = req.body;
      const updatedSettings = await this._settingsService.updateAboutPage(aboutPage || '');
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(updatedSettings, 'About page updated successfully')
      );
    } catch (error: unknown) {
      const err = error as Error;
      res.status(err instanceof AppError ? err.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(err.message || 'Failed to update about page')
      );
    }
  }

  async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const { logoUrl, companyName, aboutPage } = req.body;
      
      const updateData: {
        logoUrl?: string | null;
        companyName?: string | null;
        aboutPage?: string | null;
      } = {};

      if (logoUrl !== undefined) updateData.logoUrl = logoUrl;
      if (companyName !== undefined) updateData.companyName = companyName;
      if (aboutPage !== undefined) updateData.aboutPage = aboutPage;

      const updatedSettings = await this._settingsService.updateSettings(updateData);
      
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse(updatedSettings, 'Settings updated successfully')
      );
    } catch (error: unknown) {
      const err = error as Error;
      res.status(err instanceof AppError ? err.statusCode : HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(err.message || 'Failed to update settings')
      );
    }
  }
}

