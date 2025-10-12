import { injectable } from 'inversify';
import { IResumeRepository } from '../interfaces/IResumeRepository';
import { prisma } from '../../prisma/client';

@injectable()
export class ResumeRepository implements IResumeRepository {
  async saveResume(userId: string, resumeUrl: string): Promise<void> {
    await prisma.userProfile.update({
      where: { userId },
      data: { resume: resumeUrl }  
    });
  }

  async getResume(userId: string): Promise<string | null> {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { resume: true }  
    });
    return profile?.resume || null;
  }

  async deleteResume(userId: string): Promise<void> {
    await prisma.userProfile.update({
      where: { userId },
      data: { resume: null }  
    });
  }
}