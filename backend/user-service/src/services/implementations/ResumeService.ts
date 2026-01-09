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
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        throw new AppError('Cloudinary configuration is missing. Please check environment variables.', HttpStatusCode.INTERNAL_SERVER_ERROR);
      }

    
      const base64String = resumeFile.toString('base64');
      const dataUri = `data:${mimeType};base64,${base64String}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: 'user-resumes',
        resource_type: 'raw',
        public_id: `resume_${userId}_${Date.now()}`,
        overwrite: false
      });

      if (!result || !result.secure_url) {
        throw new AppError(Messages.RESUME.UPLOAD_FAILED, HttpStatusCode.INTERNAL_SERVER_ERROR);
      }
      await this._resumeRepository.saveResume(userId, result.secure_url);
      return result.secure_url;
    } catch (error: unknown) {
      const err = error as { message?: string; stack?: string; http_code?: number };
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