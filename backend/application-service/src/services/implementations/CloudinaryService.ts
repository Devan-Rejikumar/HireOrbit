/**
 * Cloudinary Service for Application Service
 * Secure implementation for RAW (PDF) assets using authenticated delivery
 *

 */

import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';
import { injectable } from 'inversify';
import { logger } from '../../utils/logger';

export interface SignedUploadUrlResponse {
  uploadUrl: string;
  publicId: string;
  timestamp: number;
  signature: string;
  apiKey: string;
  resourceType: 'raw' | 'image';
}

export interface SignedAccessUrlResponse {
  signedUrl: string;
  expiresAt: Date;
}

@injectable()
export class CloudinaryService {
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor() {
    this.cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
    this.apiKey = process.env.CLOUDINARY_API_KEY || '';
    this.apiSecret = process.env.CLOUDINARY_API_SECRET || '';

    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      throw new Error('Cloudinary configuration missing');
    }

    cloudinary.config({
      cloud_name: this.cloudName,
      api_key: this.apiKey,
      api_secret: this.apiSecret,
      secure: true,
    });
  }

  /**
   * Generate signed upload URL for direct frontend upload
   * Asset is uploaded as AUTHENTICATED (private)
   * 
   * IMPORTANT: For raw files, Cloudinary will append the file extension
   * to the public_id automatically during upload
   */
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

    // IMPORTANT: folder is embedded INSIDE public_id
    // For raw files, don't include .pdf here - Cloudinary adds it automatically
    const publicId = `${folder}/${publicIdPrefix}_${uniqueSuffix}`;

    const params: Record<string, string | number> = {
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
      .update(paramsString + this.apiSecret)
      .digest('hex');

    const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/${resourceType}/upload`;

    logger.info('Generated signed upload URL', {
      publicId,
      resourceType,
      timestamp,
    });

    return {
      uploadUrl,
      publicId,
      timestamp,
      signature,
      apiKey: this.apiKey,
      resourceType,
    };
  }

  /**
   * Generate a short-lived signed access URL for raw resources
   * Handles both authenticated and public (upload) resources
   * 
   * CRITICAL: For private_download_url, the format is passed as a separate parameter
   * So we should NOT add .pdf to the publicId - use it exactly as stored in Cloudinary
   */
  generateSignedAccessUrl(
    publicId: string,
    resourceType: 'raw' | 'image' = 'raw',
    expiresInSeconds = 1800,
    accessType: 'authenticated' | 'upload' = 'authenticated'
  ): SignedAccessUrlResponse {
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    const expiresAtTimestamp = Math.floor(expiresAt.getTime() / 1000);

    try {
      // For private_download_url, the format ('pdf') is passed separately
      // So we should NOT add .pdf extension to the publicId
      // Use the publicId exactly as it exists in Cloudinary (from verification)
      const cleanPublicId = publicId.endsWith('.pdf') ? publicId.slice(0, -4) : publicId;
      
      logger.debug('Generating signed URL', {
        originalPublicId: publicId,
        cleanPublicId,
        resourceType,
        accessType,
      });
      
      let signedUrl: string;
      
      if (accessType === 'authenticated') {
        // Use private_download_url for authenticated resources
        // Format 'pdf' is passed separately - don't include in publicId
        signedUrl = cloudinary.utils.private_download_url(
          cleanPublicId,
          'pdf',
          {
            resource_type: resourceType,
            type: 'authenticated',
            expires_at: expiresAtTimestamp,
            attachment: true,
          }
        );
      } else {
        // For public resources, generate a direct URL with attachment flag
        signedUrl = cloudinary.url(cleanPublicId, {
          resource_type: resourceType,
          type: 'upload',
          secure: true,
          flags: 'attachment',
          format: 'pdf',
        });
      }

      return { signedUrl, expiresAt };
    } catch (error: any) {
      logger.error('Failed to generate signed download URL', {
        publicId,
        accessType,
        error: error?.message,
        stack: error?.stack,
      });
      throw new Error(`Failed to generate signed download URL: ${error?.message || 'Unknown error'}`);
    }
  }


  /**
   * Verify that an uploaded asset exists in Cloudinary
   * Tries multiple access types (authenticated, upload/public) and publicId formats
   * NEVER return URLs from here
   */
  async verifyUpload(
    publicId: string,
    resourceType: 'raw' | 'image' = 'raw'
  ): Promise<{ actualPublicId: string; accessType: string }> {
    // Try different combinations of publicId and access type
    const publicIdVariations = [
      publicId,
      publicId.endsWith('.pdf') ? publicId.slice(0, -4) : `${publicId}.pdf`,
    ];
    
    const accessTypes = ['authenticated', 'upload'] as const;
    
    for (const pid of publicIdVariations) {
      for (const accessType of accessTypes) {
        try {
          const resource = await cloudinary.api.resource(pid, {
            resource_type: resourceType,
            type: accessType,
          });
          
          logger.info('Upload verification successful', { 
            requestedPublicId: publicId,
            actualPublicId: resource.public_id,
            accessType,
            format: resource.format,
          });
          
          return { actualPublicId: resource.public_id, accessType };
        } catch (error: any) {
          // Continue to next variation
          logger.debug('Verification attempt failed', {
            publicId: pid,
            accessType,
            error: error?.message,
          });
        }
      }
    }
    
    // All attempts failed
    logger.error('Upload verification failed - resource not found in any format', {
      publicId,
      resourceType,
      triedVariations: publicIdVariations,
      triedAccessTypes: accessTypes,
    });
    throw new Error(`Upload verification failed: Resource not found`);
  }
}