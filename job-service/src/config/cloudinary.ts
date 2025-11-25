import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { AppConfig } from './app.config';
import { CloudinaryParams } from '../types/cloudinary';

cloudinary.config({
  cloud_name: AppConfig.CLOUDINARY_CLOUD_NAME,
  api_key: AppConfig.CLOUDINARY_API_KEY,
  api_secret: AppConfig.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: AppConfig.CLOUDINARY_FOLDER,
    allowed_formats: [...AppConfig.CLOUDINARY_ALLOWED_FORMATS],
    resource_type: 'raw',
    transformation: [
      { quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  } as CloudinaryParams,
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: AppConfig.MAX_FILE_SIZE_BYTES, 
  },
  fileFilter,
});

export default cloudinary;
