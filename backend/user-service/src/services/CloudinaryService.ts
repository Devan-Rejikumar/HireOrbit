/**
 * Cloudinary Service
 * Industry-safe implementation for RAW (PDF) and IMAGE assets
 */

import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';
import { Logger } from 'winston';

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
  private readonly _logger: Logger;
  private readonly _cloudName: string;
  private readonly _apiKey: string;
  private readonly _apiSecret: string;

  constructor(logger: Logger) {
    this._logger = logger;
    this._cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
    this._apiKey = process.env.CLOUDINARY_API_KEY || '';
    this._apiSecret = process.env.CLOUDINARY_API_SECRET || '';

    if (!this._cloudName || !this._apiKey || !this._apiSecret) {
      throw new Error('Cloudinary configuration missing');
    }

    cloudinary.config({
      cloud_name: this._cloudName,
      api_key: this._apiKey,
      api_secret: this._apiSecret,
      secure: true,
    });
  }


  generateSignedUploadUrl(
    folder: string,
    publicIdPrefix: string,
    resourceType: 'raw' | 'image' = 'raw',
    userId?: string
  ): SignedUploadUrlResponse {
    const timestamp = Math.floor(Date.now() / 1000);
    const uniqueSuffix = userId
      ? `${userId}_${Date.now()}`
      : Date.now().toString();

    const publicId = `${folder}/${publicIdPrefix}_${uniqueSuffix}`;

    const params: Record<string, string | number> = {
      folder,
      public_id: publicId,
      timestamp,
      type: 'authenticated',
    };

    const paramsString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    const signature = crypto
      .createHash('sha1')
      .update(paramsString + this._apiSecret)
      .digest('hex');

    const uploadUrl = `https://api.cloudinary.com/v1_1/${this._cloudName}/${resourceType}/upload`;

    return {
      uploadUrl,
      publicId,
      timestamp,
      signature,
      apiKey: this._apiKey,
      folder,
      resourceType,
    };
  }


  generateSignedAccessUrl(
    publicId: string,
    resourceType: 'raw' | 'image' = 'raw',
    expiresInSeconds = 3600 
  ): SignedAccessUrlResponse {
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    const expiresAtTimestamp = Math.floor(expiresAt.getTime() / 1000);

    const signedUrl = cloudinary.url(publicId, {
      resource_type: resourceType,
      type: 'authenticated',
      sign_url: true,
      expires_at: expiresAtTimestamp,
      secure: true,
    });

    return {
      signedUrl,
      expiresAt,
    };
  }

  async verifyUpload(
    publicId: string,
    resourceType: 'raw' | 'image' = 'raw'
  ): Promise<string> {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType,
        type: 'authenticated',
      });

      if (!result?.secure_url) {
        throw new Error('Resource not found');
      }

      return result.secure_url;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this._logger.error('Upload verification failed', {
        publicId,
        error: errorMessage,
      });
      throw new Error('Upload verification failed');
    }
  }
}
