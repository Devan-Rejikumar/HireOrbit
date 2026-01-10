import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import { logger } from '../utils/logger';
import { Messages } from '../constants/Messages';

/* ------------------------------------------------------------------ */
/*  ENV LOADING (DEV ONLY)                                             */
/* ------------------------------------------------------------------ */

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();
}

/* ------------------------------------------------------------------ */
/*  CONFIG VALIDATION                                                  */
/* ------------------------------------------------------------------ */

if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  throw new Error(Messages.CLOUDINARY.CONFIG_MISSING);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/* ------------------------------------------------------------------ */
/*  RESUME UPLOAD (RAW, PUBLIC)                                       */
/* ------------------------------------------------------------------ */

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  originalName: string,
  userId: string
): Promise<string> => {
  const ext = path.extname(originalName) || '.pdf';
  const publicId = `job-applications/resumes/resume_${userId}_${Date.now()}${ext}`;

  const result = await cloudinary.uploader.upload(
    `data:application/pdf;base64,${fileBuffer.toString('base64')}`,
    {
      resource_type: 'raw',
      public_id: publicId,
      overwrite: false,
    }
  );

  if (!result?.secure_url) {
    throw new Error(Messages.CLOUDINARY.UPLOAD_FAILED);
  }

  return result.secure_url;
};

/* ------------------------------------------------------------------ */
/*  IMAGE UPLOAD (LOGO / SIGNATURE)                                   */
/* ------------------------------------------------------------------ */

export const uploadImageToCloudinary = async (
  fileBuffer: Buffer,
  fileName: string,
  folder: string
): Promise<string> => {
  const ext = path.extname(fileName) || '.png';
  const publicId = `${folder}/${fileName.replace(ext, '')}_${Date.now()}`;

  const result = await cloudinary.uploader.upload(
    `data:image/png;base64,${fileBuffer.toString('base64')}`,
    {
      resource_type: 'image',
      public_id: publicId,
      overwrite: false,
    }
  );

  if (!result?.secure_url) {
    throw new Error(Messages.CLOUDINARY.UPLOAD_FAILED);
  }

  return result.secure_url;
};

/* ------------------------------------------------------------------ */
/*  OFFER PDF UPLOAD (RAW, AUTHENTICATED)                              */
/* ------------------------------------------------------------------ */
/**
 * RULES:
 * - RAW
 * - AUTHENTICATED
 * - public_id WITHOUT extension
 */
export const uploadOfferPdfToCloudinary = async (
  fileBuffer: Buffer,
  publicId: string
): Promise<{ publicId: string }> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: 'raw',
          type: 'authenticated',
          public_id: publicId,
          overwrite: false,
        },
        (error, result) => {
          if (error || !result?.public_id) {
            return reject(
              error || new Error(Messages.CLOUDINARY.UPLOAD_FAILED)
            );
          }
          resolve({ publicId: result.public_id });
        }
      )
      .end(fileBuffer);
  });
};

/* ------------------------------------------------------------------ */
/*  OFFER PDF DOWNLOAD (AUTHENTICATED)                                 */
/* ------------------------------------------------------------------ */

export const generateSignedAccessUrl = (
  publicIdOrUrl: string,
  resourceType: 'raw' | 'image' = 'raw',
  expiresIn: number = 1800
): { signedUrl: string; expiresAt: Date } => {
  let publicId = publicIdOrUrl;
  let format: string | undefined;

  if (publicIdOrUrl.startsWith('http')) {
    const match = publicIdOrUrl.match(/\/upload\/(?:v\d+\/)?(.+)$/);
    if (match) {
      const extracted = match[1];
      const dot = extracted.lastIndexOf('.');
      if (dot > -1) {
        publicId = extracted.slice(0, dot);
        format = extracted.slice(dot + 1);
      } else {
        publicId = extracted;
      }
    }
  }

  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  const signedUrl = cloudinary.url(publicId, {
    resource_type: resourceType,
    sign_url: true,
    expires_at: Math.floor(expiresAt.getTime() / 1000),
    secure: true,
    format,
  });

  return { signedUrl, expiresAt };
};

export default cloudinary;

