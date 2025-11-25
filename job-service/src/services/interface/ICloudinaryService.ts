/**
 * Cloudinary Service Interface
 * Handles Cloudinary operations including signed URL generation
 */
export interface ICloudinaryService {
  /**
   * Generate a signed URL for a Cloudinary resource
   * @param publicId - The public ID of the Cloudinary resource
   * @param resourceType - The resource type (image, raw, video, etc.)
   * @param expiresIn - Optional expiration time in seconds (defaults to configured value)
   * @returns Signed URL string
   */
  generateSignedUrl(publicId: string, resourceType?: string, expiresIn?: number): string;
  
  /**
   * Generate a signed URL from a full Cloudinary URL
   * @param url - Full Cloudinary URL
   * @param expiresIn - Optional expiration time in seconds (defaults to configured value)
   * @returns Signed URL string
   */
  generateSignedUrlFromUrl(url: string, expiresIn?: number): string;
  
  /**
   * Extract public ID from a Cloudinary URL
   * @param url - Full Cloudinary URL
   * @returns Public ID or null if invalid URL
   */
  extractPublicIdFromUrl(url: string): string | null;
}

