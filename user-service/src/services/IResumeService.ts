export interface IResumeService {
  uploadResume(userId: string, resumeFile: Buffer, fileName: string, mimeType: string): Promise<string>;
  getResume(userId: string): Promise<string | null>;
  updateResume(userId: string, resumeFile: Buffer, fileName: string, mimeType: string): Promise<string>;
  deleteResume(userId: string): Promise<void>;
}