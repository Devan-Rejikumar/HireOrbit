import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import { Request } from 'express';
import { logger } from '../utils/logger';
import { Messages } from '../constants/Messages';

const CLOUDINARY_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, 
  DEFAULT_EXTENSION: '.pdf',
  FOLDER_PREFIX: 'job-applications/resumes',
} as const;

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
] as const;

const MIME_TYPE_MAP: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
} as const;

dotenv.config({ path: '.env' });

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  throw new Error(Messages.CLOUDINARY.CONFIG_MISSING);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype as typeof ALLOWED_MIME_TYPES[number])) {
    cb(null, true);
  } else {
    cb(new Error(Messages.CLOUDINARY.FILE_TYPE_ERROR));
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: CLOUDINARY_CONFIG.MAX_FILE_SIZE,
  },
  fileFilter: fileFilter,
});

export const uploadToCloudinary = async (fileBuffer: Buffer, originalName: string, userId: string): Promise<string> => {
  try {

    logger.info('[uploadToCloudinary] Starting upload with config:', {
      hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
      hasApiKey: !!process.env.CLOUDINARY_API_KEY,
      hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'MISSING',
      fileSize: fileBuffer.length,
      fileName: originalName,
    });

    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error(Messages.CLOUDINARY.CONFIG_VALIDATION_FAILED);
    }

    const timestamp = Date.now();
    const ext = path.extname(originalName) || CLOUDINARY_CONFIG.DEFAULT_EXTENSION;
    const publicId = `${CLOUDINARY_CONFIG.FOLDER_PREFIX}/resume_${userId}_${timestamp}${ext}`;

    const mimeType = MIME_TYPE_MAP[ext] || MIME_TYPE_MAP[CLOUDINARY_CONFIG.DEFAULT_EXTENSION];
    
    logger.info('Uploading resume to Cloudinary:', {
      publicId,
      mimeType,
      fileSize: fileBuffer.length,
      userId,
    });

    const base64String = fileBuffer.toString('base64');
    const dataUri = `data:${mimeType};base64,${base64String}`;

    const result = await cloudinary.uploader.upload(dataUri, {
      public_id: publicId,
      resource_type: 'raw',
      overwrite: false,
      use_filename: false,
    });
    
    if (!result || !result.secure_url) {
      logger.error(' [Cloudinary] Upload returned invalid result:', result);
      throw new Error(Messages.CLOUDINARY.UPLOAD_INVALID_RESPONSE);
    }

    logger.info(` ${Messages.CLOUDINARY.UPLOAD_SUCCESS}:`, result.secure_url);
    return result.secure_url;
  } catch (error: unknown) {
    const err = error as { message?: string; http_code?: number; name?: string; stack?: string };
    logger.error(' [Cloudinary] Error uploading:', {
      error: err.message,
      stack: err.stack,
      http_code: err.http_code,
      name: err.name,
    });
    
    if (err.http_code === 401) {
      throw new Error(Messages.CLOUDINARY.AUTH_FAILED);
    } else if (err.http_code === 400) {
      throw new Error(`${Messages.CLOUDINARY.UPLOAD_ERROR}: ${err.message || 'Invalid request'}`);
    } else if (err.message) {
      throw new Error(`${Messages.CLOUDINARY.UPLOAD_ERROR}: ${err.message}`);
    } else {
      throw new Error(Messages.CLOUDINARY.UPLOAD_FAILED);
    }
  }
};

export const deleteResume = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw',
    });
  } catch (error) {
    logger.error(` ${Messages.CLOUDINARY.DELETE_ERROR}:`, error);
    throw error;
  }
};

export default cloudinary;
