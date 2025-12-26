export interface ResumeParseResult {
  text: string;
  sections?: {
    skills?: string[];
    experience?: string;
    education?: string;
    keywords?: string[];
  };
}

export interface ATSAnalysisResult {
  score: number; // 0-100
  improvements: string[];
  missingKeywords: string[];
  strengths?: string[];
  keywordMatch?: number;
}

export interface IATSService {
  parseResume(fileBuffer: Buffer, mimeType: string): Promise<ResumeParseResult>;
  analyzeATS(resumeText: string, jobDescription: string): Promise<ATSAnalysisResult>;
  calculateATSScore(resumeText: string, jobDescription: string): Promise<number>;
}

