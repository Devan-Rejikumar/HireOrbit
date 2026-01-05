/**
 * Cloudinary Service
 * Handles signed URL generation for uploads and access to private resources
 */

import { v2 as cloudinary, utils } from 'cloudinary';
import crypto from 'crypto';
import { logger } from '../utils/logger';

export interface SignedUploadUrlResponse {
  uploadUrl: string;
  publicId: string;
  timestamp: number;
  signature: string;
  apiKey: string;
  folder: string;
  resourceType: 'raw' | 'image';
}

export interface SignedAccessUrlResponse {
  signedUrl: string;
  expiresAt: Date;
}

export class CloudinaryService {
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor() {
    this.cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
    this.apiKey = process.env.CLOUDINARY_API_KEY || '';
    this.apiSecret = process.env.CLOUDINARY_API_SECRET || '';

    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      throw new Error('Cloudinary configuration is missing. Please check environment variables.');
    }

    cloudinary.config({
      cloud_name: this.cloudName,
      api_key: this.apiKey,
      api_secret: this.apiSecret,
    });
  }

  /**
   * Generate a signed upload URL for direct client uploads
   * @param folder - Cloudinary folder path
   * @param publicIdPrefix - Prefix for the public_id (e.g., 'resume', 'profile')
   * @param resourceType - 'raw' for documents, 'image' for images
   * @param userId - User ID for unique file naming
   */
  generateSignedUploadUrl(
    folder: string,
    publicIdPrefix: string,
    resourceType: 'raw' | 'image' = 'raw',
    userId?: string
  ): SignedUploadUrlResponse {
    const timestamp = Math.floor(Date.now() / 1000);
    const publicIdSuffix = userId ? `${userId}_${Date.now()}` : Date.now().toString();
    const publicId = `${folder}/${publicIdPrefix}_${publicIdSuffix}`;

    const params: Record<string, string | number> = {
      timestamp,
      folder,
      public_id: publicId,
    };

    // Build params string for signature (sorted keys)
    const paramsString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    const signature = crypto
      .createHash('sha1')
      .update(paramsString + this.apiSecret)
      .digest('hex');

    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/upload`;

    logger.debug('Generated signed upload URL', {
      folder,
      publicId,
      resourceType,
    });

    return {
      uploadUrl,
      publicId,
      timestamp,
      signature,
      apiKey: this.apiKey,
      folder,
      resourceType,
    };
  }

  /**
   * Generate a signed access URL for private resources
   * Uses Cloudinary's authenticated delivery with signed URLs
   * @param publicIdOrUrl - Cloudinary public_id or full URL (will extract public_id if URL provided)
   * @param resourceType - 'raw' for documents, 'image' for images
   * @param expiresIn - URL expiration time in seconds (default: 1800 = 30 minutes)
   */
  generateSignedAccessUrl(
    publicIdOrUrl: string,
    resourceType: 'raw' | 'image' = 'raw',
    expiresIn: number = 1800
  ): SignedAccessUrlResponse {
    // Extract public_id from URL if URL provided
    let publicId = publicIdOrUrl;
    if (publicIdOrUrl.startsWith('http')) {
      const extracted = this.extractPublicIdFromUrl(publicIdOrUrl);
      if (extracted) {
        publicId = extracted;
      }
    }

    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    const expiresAtTimestamp = Math.floor(expiresAt.getTime() / 1000);

    // Use Cloudinary SDK to generate signed URL
    const signedUrl = cloudinary.url(publicId, {
      resource_type: resourceType,
      type: 'authenticated',
      sign_url: true,
      expires_at: expiresAtTimestamp,
      secure: true,
    });

    logger.debug('Generated signed access URL', {
      publicId,
      resourceType,
      expiresIn,
      expiresAt: expiresAt.toISOString(),
    });

    return {
      signedUrl,
      expiresAt,
    };
  }

  /**
   * Extract public_id from Cloudinary URL
   */
  extractPublicIdFromUrl(url: string): string | null {
    try {
      // Pattern: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/v{version}/{folder}/{public_id}.{ext}
      // Or: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/{public_id}
      const patterns = [
        /\/upload\/v\d+\/(.+)$/,  // Versioned URL
        /\/upload\/(.+)$/,         // Direct upload URL
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          // Remove file extension if present
          return match[1].split('.')[0];
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Verify and confirm an upload after client uploads directly
   * @param publicId - The public_id that was uploaded
   * @param resourceType - 'raw' for documents, 'image' for images
   */
  async verifyUpload(publicId: string, resourceType: 'raw' | 'image' = 'raw'): Promise<string> {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
      });

      if (result && result.secure_url) {
        logger.info('Upload verified', { publicId, url: result.secure_url });
        return result.secure_url;
      }

      throw new Error('Upload verification failed: resource not found');
    } catch (error: unknown) {
      const err = error as { message?: string };
      logger.error('Upload verification error', { publicId, error: err.message });
      throw new Error(`Upload verification failed: ${err.message || 'Unknown error'}`);
    }
  }
}

