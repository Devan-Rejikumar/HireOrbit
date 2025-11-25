/**
 * Cloudinary-related types
 */

export interface CloudinaryParams {
  folder: string;
  allowed_formats: string[];
  resource_type: string;
  transformation?: object[];
}

