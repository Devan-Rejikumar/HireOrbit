import { injectable } from 'inversify';
import { v2 as cloudinary } from 'cloudinary';
import { ICloudinaryService } from '../interface/ICloudinaryService';
import { AppConfig } from '../../config/app.config';

@injectable()
export class CloudinaryService implements ICloudinaryService {
  private readonly _defaultExpiry: number;

  constructor() {
    this._defaultExpiry = AppConfig.CLOUDINARY_SIGNED_URL_EXPIRY_SECONDS;
  }

  generateSignedUrl(publicId: string, resourceType: string = 'raw', expiresIn?: number): string {
    const expiry = expiresIn || this._defaultExpiry;
    const timestamp = Math.round(Date.now() / 1000) + expiry;
    
    try {
      return cloudinary.url(publicId, {
        resource_type: resourceType,
        sign_url: true,
        expires_at: timestamp,
        secure: true,
      });
    } catch {
      return cloudinary.url(publicId, {
        resource_type: resourceType,
        secure: true,
      });
    }
  }

  generateSignedUrlFromUrl(url: string, expiresIn?: number): string {
    const publicId = this.extractPublicIdFromUrl(url);
    if (!publicId) {
      return url;
    }

    return this.generateSignedUrl(publicId, 'raw', expiresIn);
  }

  extractPublicIdFromUrl(url: string): string | null {
    try {
      if (!url || !url.includes('cloudinary.com')) {
        return null;
      }

      const urlParts = url.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      
      if (uploadIndex === -1) {
        return null;
      }

      const publicIdWithVersion = urlParts.slice(uploadIndex + 2).join('/');
      const publicIdParts = publicIdWithVersion.split('.');
      const publicIdWithoutExtension = publicIdParts.slice(0, -1).join('.');
      
      return publicIdWithoutExtension || publicIdWithVersion;
    } catch {
      return null;
    }
  }
}

