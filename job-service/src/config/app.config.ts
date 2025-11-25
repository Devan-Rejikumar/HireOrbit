/**
 * Application Configuration
 * Non-sensitive configuration values with safe defaults
 * Sensitive values (secrets, passwords) should be in .env file
 */

export const AppConfig = {
  PORT: process.env.PORT || '3002',
  
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  LOKI_HOST: process.env.LOKI_HOST || 'http://localhost:3100',
  
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME!,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY!,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET!,
  CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER || 'job-portal/resumes',
  CLOUDINARY_SIGNED_URL_EXPIRY_SECONDS: parseInt(process.env.CLOUDINARY_SIGNED_URL_EXPIRY_SECONDS || '3600'),
  
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '5'),
  get MAX_FILE_SIZE_BYTES(): number {
    return this.MAX_FILE_SIZE_MB * 1024 * 1024;
  },
  
  JSON_BODY_SIZE_LIMIT_MB: parseInt(process.env.JSON_BODY_SIZE_LIMIT_MB || '20'),
  URL_ENCODED_BODY_SIZE_LIMIT_MB: parseInt(process.env.URL_ENCODED_BODY_SIZE_LIMIT_MB || '20'),
  
  CLOUDINARY_ALLOWED_FORMATS: ['pdf', 'doc', 'docx'],
} as const;

