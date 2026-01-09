import { injectable } from 'inversify';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { IATSService, ResumeParseResult } from '../interfaces/IATSService';
import { logger } from '../../utils/logger';

@injectable()
export class ResumeParserService implements IATSService {
  async calculateATSScore(_resumeText: string, _jobDescription: string): Promise<number> {
    throw new Error('Use GrokATSService for ATS score calculation');
  }

  async parseResume(fileBuffer: Buffer, mimeType: string): Promise<ResumeParseResult> {
    try {
      let text = '';

      if (mimeType === 'application/pdf' || mimeType === 'application/x-pdf') {
        // Parse PDF
        const pdfData = await pdfParse(fileBuffer);
        text = pdfData.text;
      } else if (
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'application/msword' ||
        mimeType.includes('wordprocessingml')
      ) {
        // Parse DOCX
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        text = result.value;
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      // Clean and normalize text
      text = this.cleanText(text);

      // Extract sections (basic extraction)
      const sections = this.extractSections(text);

      return {
        text,
        sections,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error('Error parsing resume:', {
        mimeType,
        bufferSize: fileBuffer?.length || 0,
        error: errorMessage,
        errorStack,
        errorType: error?.constructor?.name,
      });
      throw new Error(`Failed to parse resume: ${errorMessage}`);
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  private extractSections(text: string): ResumeParseResult['sections'] {
    const lowerText = text.toLowerCase();
    const sections: ResumeParseResult['sections'] = {};

    const skillKeywords = ['skills', 'technical skills', 'core competencies', 'expertise', 'proficiencies'];
    const skillMatch = skillKeywords.find(keyword => lowerText.includes(keyword));
    if (skillMatch) {
      const skillIndex = lowerText.indexOf(skillMatch);
      const skillSection = text.substring(skillIndex, skillIndex + 500);
      const skills = this.extractListItems(skillSection);
      if (skills.length > 0) {
        sections.skills = skills;
      }
    }

    // Extract experience
    const expKeywords = ['experience', 'work experience', 'employment', 'professional experience'];
    const expMatch = expKeywords.find(keyword => lowerText.includes(keyword));
    if (expMatch) {
      const expIndex = lowerText.indexOf(expMatch);
      sections.experience = text.substring(expIndex, Math.min(expIndex + 2000, text.length));
    }

    // Extract education
    const eduKeywords = ['education', 'academic', 'qualifications', 'degrees'];
    const eduMatch = eduKeywords.find(keyword => lowerText.includes(keyword));
    if (eduMatch) {
      const eduIndex = lowerText.indexOf(eduMatch);
      sections.education = text.substring(eduIndex, Math.min(eduIndex + 1000, text.length));
    }

    // Extract keywords (common technical terms)
    const keywords = this.extractKeywords(text);
    if (keywords.length > 0) {
      sections.keywords = keywords;
    }

    return sections;
  }

  private extractListItems(text: string): string[] {

    const items: string[] = [];

    const bulletMatches = text.match(/[•\-\*]\s*([^\n]+)/g);
    if (bulletMatches) {
      items.push(...bulletMatches.map(match => match.replace(/[•\-\*]\s*/, '').trim()));
    }

    if (items.length === 0) {
      const commaMatches = text.split(',').map(item => item.trim()).filter(item => item.length > 2);
      items.push(...commaMatches.slice(0, 20)); 
    }

    return items.filter(item => item.length > 0 && item.length < 100);
  }

  private extractKeywords(text: string): string[] {
    // Common technical keywords
    const commonKeywords = [
      'javascript', 'typescript', 'python', 'java', 'react', 'node.js', 'angular', 'vue',
      'sql', 'mongodb', 'postgresql', 'aws', 'docker', 'kubernetes', 'git', 'agile',
      'scrum', 'ci/cd', 'rest api', 'graphql', 'microservices', 'machine learning', 'ai',
      'html', 'css', 'sass', 'less', 'redux', 'next.js', 'express', 'django', 'flask',
      'spring', 'hibernate', 'junit', 'jest', 'cypress', 'selenium', 'terraform',
      'ansible', 'jenkins', 'github actions', 'gitlab ci', 'linux', 'unix', 'bash',
    ];

    const lowerText = text.toLowerCase();
    const foundKeywords = commonKeywords.filter(keyword => lowerText.includes(keyword.toLowerCase()));

    return foundKeywords;
  }

  // This method is required by IATSService but analysis is done by GrokATSService (uses GROQ)
  async analyzeATS(_resumeText: string, _jobDescription: string): Promise<never> {
    throw new Error('Use GrokATSService for ATS analysis');
  }
}

