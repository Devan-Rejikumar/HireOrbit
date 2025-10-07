import { injectable, inject } from 'inversify';
import { IResumeService } from './IResumeService';
import { IResumeRepository } from '../repositories/IResumeRepository';
import  cloudinary  from '../config/cloudinary';

@injectable()
export class ResumeService implements IResumeService {
  constructor(
    @inject('IResumeRepository') private _resumeRepository: IResumeRepository
  ) {}

  async uploadResume(userId: string, resumeFile: Buffer, fileName: string, mimeType: string): Promise<string> {

    const result = await cloudinary.uploader.upload(
      `data:${mimeType};base64,${resumeFile.toString('base64')}`,
      {
        folder: 'user-resumes',
        resource_type: 'raw',
        public_id: `resume_${userId}_${Date.now()}`
      }
    );
    await this._resumeRepository.saveResume(userId, result.secure_url);
    
    return result.secure_url;
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