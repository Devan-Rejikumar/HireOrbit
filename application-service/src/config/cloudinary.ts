import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';


dotenv.config({ path: '.env' });


process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dgbbdhdg7';
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '372466265213178';
process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || 'RsbEo43EGP0e-lKgzEKqF2ktw-4';

console.log('🔍 [Cloudinary] Environment variables:');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY);
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed for resumes'));
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: fileFilter,
});

export const uploadToCloudinary = async (fileBuffer: Buffer, originalName: string, userId: string): Promise<string> => {
  try {
    const timestamp = Date.now();
    const ext = path.extname(originalName);
    const publicId = `job-applications/resumes/resume_${userId}_${timestamp}${ext}`;
    
    const result = await cloudinary.uploader.upload(`data:application/octet-stream;base64,${fileBuffer.toString('base64')}`, {
      public_id: publicId,
      resource_type: 'raw',
      folder: 'job-applications/resumes',
      type: 'upload', 
      access_mode: 'public' 
    });
    
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

export const deleteResume = async (publicId: string): Promise<void> => {
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'raw'
    });
  } catch (error) {
    console.error('Error deleting resume from Cloudinary:', error);
    throw error;
  }
};

export default cloudinary;
