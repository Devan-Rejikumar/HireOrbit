import { injectable, inject } from 'inversify';
import TYPES from '../../config/types';
import { IResumeService } from '../interfaces/IResumeService';
import { IResumeRepository } from '../../repositories/interfaces/IResumeRepository';
import  cloudinary  from '../../config/cloudinary';
import { AppError } from '../../utils/errors/AppError';
import { HttpStatusCode } from '../../enums/StatusCodes';
import { Messages } from '../../constants/Messages';

@injectable()
export class ResumeService implements IResumeService {
  constructor(
    @inject(TYPES.IResumeRepository) private _resumeRepository: IResumeRepository
  ) {}

  async uploadResume(userId: string, resumeFile: Buffer, fileName: string, mimeType: string): Promise<string> {
    try {
      console.log(' [ResumeService] Starting Cloudinary upload:', {
        userId,
        fileName,
        mimeType,
        fileSize: resumeFile.length
      });

    
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.error(' [ResumeService] Cloudinary configuration missing');
        throw new AppError('Cloudinary configuration is missing. Please check environment variables.', HttpStatusCode.INTERNAL_SERVER_ERROR);
      }

    
      const base64String = resumeFile.toString('base64');
      const dataUri = `data:${mimeType};base64,${base64String}`;

      console.log(' [ResumeService] Uploading to Cloudinary...');
      const result = await cloudinary.uploader.upload(dataUri, {
        folder: 'user-resumes',
        resource_type: 'raw',
        public_id: `resume_${userId}_${Date.now()}`,
        overwrite: false
      });

      if (!result || !result.secure_url) {
        console.error('[ResumeService] Cloudinary upload returned invalid result:', result);
        throw new AppError(Messages.RESUME.UPLOAD_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
      }

      console.log(' [ResumeService] Cloudinary upload successful:', result.secure_url);
      await this._resumeRepository.saveResume(userId, result.secure_url);
      console.log('✅ [ResumeService] Resume URL saved to database');
      
      return result.secure_url;
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string; http_code?: number };
      console.error(' [ResumeService] Resume upload error:', {
        error: err.message,
        stack: err.stack,
        userId,
        fileName,
        mimeType
      });

      if (error instanceof AppError) {
        throw error;
      }

   
      if (err.http_code) {
        throw new AppError(
          `Cloudinary upload failed: ${err.message || 'Unknown error'}`,
          HttpStatusCode.INTERNAL_SERVER_ERROR
        );
      }

  
      throw new AppError(
        err.message || Messages.RESUME.UPLOAD_FAILED,
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getResume(userId: string): Promise<string | null> {
    return this._resumeRepository.getResume(userId);
  }

  async updateResume(userId: string, resumeFile: Buffer, fileName: string, mimeType: string): Promise<string> {

    await this.deleteResume(userId);
    return this.uploadResume(userId, resumeFile, fileName, mimeType);
  }

  async deleteResume(userId: string): Promise<void> {
    await this._resumeRepository.deleteResume(userId);
  }
}