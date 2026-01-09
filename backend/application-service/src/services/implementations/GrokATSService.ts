import { injectable } from 'inversify';
import { IATSService, ATSAnalysisResult } from '../interfaces/IATSService';
import { logger } from '../../utils/logger';
import axios from 'axios';

interface GroqResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
}

@injectable()
export class GrokATSService implements IATSService {
  private readonly groqApiUrl: string;
  private readonly groqApiKey: string;

  constructor() {
    this.groqApiUrl = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
    this.groqApiKey = process.env.GROQ_API_KEY || '';

    if (!this.groqApiKey) {
      logger.warn('GROQ_API_KEY not set. ATS analysis will not work.');
    }
  }

  async parseResume(_fileBuffer: Buffer, _mimeType: string): Promise<never> {
    throw new Error('Use ResumeParserService for resume parsing');
  }

  /**
   * Calculate only the ATS score (0-100) without full analysis details
   * Used for company-side automatic scoring during application creation
   */
  async calculateATSScore(resumeText: string, jobDescription: string): Promise<number> {
    logger.info('calculateATSScore called', {
      hasApiKey: !!this.groqApiKey,
      apiKeyLength: this.groqApiKey?.length || 0,
      resumeTextLength: resumeText?.length || 0,
      jobDescriptionLength: jobDescription?.length || 0,
    });

    if (!this.groqApiKey) {
      logger.warn('GROQ API key not configured, returning default score', {
        apiUrl: this.groqApiUrl,
      });
      return 0;
    }

    try {
      logger.info('Calling GROQ API for ATS score calculation', {
        apiUrl: this.groqApiUrl,
        model: 'llama-3.1-8b-instant',
      });
      const prompt = this.buildScoreOnlyPrompt(resumeText, jobDescription);

      const response = await axios.post<GroqResponse>(
        this.groqApiUrl,
        {
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: 'You are an ATS (Applicant Tracking System) analyzer. Return ONLY a JSON object with a numeric score from 0-100. No explanations, no markdown, just JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 100, 
        },
        {
          headers: {
            'Authorization': `Bearer ${this.groqApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      const content = response.data.choices?.[0]?.message?.content;
      if (!content) {
        logger.warn('No response content from GROQ API for score calculation');
        return 0;
      }

      let jsonString = content.trim();
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/```\n?/g, '').replace(/```$/g, '');
      }

      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonString) as { score?: number };
      const score = parsed.score;

      if (typeof score !== 'number' || isNaN(score)) {
        logger.warn('Invalid score from GROQ API, returning 0');
        return 0;
      }

      return Math.max(0, Math.min(100, Math.round(score)));
    } catch (error) {
      logger.error('Error calculating ATS score:', {
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  async analyzeATS(resumeText: string, jobDescription: string): Promise<ATSAnalysisResult> {
    if (!this.groqApiKey) {
      throw new Error('GROQ API key is not configured');
    }

    try {
      const prompt = this.buildATSPrompt(resumeText, jobDescription);

      const response = await axios.post<GroqResponse>(
        this.groqApiUrl,
        {
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: 'You are an ATS (Applicant Tracking System) analyzer. Analyze resumes against job descriptions and return structured JSON responses only. Do not include explanations or markdown formatting.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3, 
          max_tokens: 2000,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.groqApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, 
        },
      );

      const content = response.data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No response content from GROQ API');
      }
      const analysis = this.parseGroqResponse(content);

      return analysis;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        const errorMessage = errorData?.error?.message || errorData?.message || error.message;
        const statusCode = error.response?.status;
        const errorDetails = errorData?.error || errorData;
        
        logger.error('Error calling GROQ API:', {
          status: statusCode,
          message: errorMessage,
          errorType: errorData?.error?.type || errorData?.type,
          url: this.groqApiUrl,
          hasApiKey: !!this.groqApiKey,
          apiKeyLength: this.groqApiKey?.length || 0,
          requestData: {
            model: 'llama-3.1-70b-versatile',
            hasResumeText: !!resumeText,
            resumeTextLength: resumeText?.length || 0,
            hasJobDescription: !!jobDescription,
            jobDescriptionLength: jobDescription?.length || 0,
          },
        });
        
        if (errorData) {
          try {
            logger.error('GROQ API error response:', JSON.stringify(errorData, null, 2));
          } catch {
            logger.error('GROQ API error response (could not stringify):', String(errorData));
          }
        }
        
        if (statusCode === 400) {
          const detailedMessage = errorMessage || JSON.stringify(errorDetails) || 'Invalid request. Please check your API key and request format.';
          throw new Error(`GROQ API error (400): ${detailedMessage}`);
        } else if (statusCode === 401) {
          throw new Error('GROQ API error: Invalid API key. Please check your GROQ_API_KEY environment variable.');
        } else if (statusCode === 429) {
          throw new Error('GROQ API error: Rate limit exceeded. Please try again later.');
        } else {
          throw new Error(`GROQ API error (${statusCode}): ${errorMessage || 'Failed to analyze resume'}`);
        }
      }
      
      logger.error('Error calling GROQ API:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      throw new Error(`Failed to analyze ATS: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildScoreOnlyPrompt(resumeText: string, jobDescription: string): string {
    return `Compare the following resume against the job description and return ONLY a JSON object with a numeric score from 0-100 representing ATS compatibility.

Example response format: {"score": 75}

Resume Text:
${resumeText.substring(0, 8000)}${resumeText.length > 8000 ? '...' : ''}

Job Description:
${jobDescription.substring(0, 8000)}${jobDescription.length > 8000 ? '...' : ''}

Return ONLY valid JSON with the score field. No markdown, no explanations.`;
  }

  private buildATSPrompt(resumeText: string, jobDescription: string): string {
    return `Analyze the following resume against the job description and provide a JSON response with the following structure:

{
  "score": <number 0-100>,
  "improvements": [<array of improvement suggestions>],
  "missingKeywords": [<array of important keywords from JD missing in resume>],
  "strengths": [<array of resume strengths>],
  "keywordMatch": <percentage 0-100>
}

Resume Text:
${resumeText.substring(0, 8000)}${resumeText.length > 8000 ? '...' : ''}

Job Description:
${jobDescription.substring(0, 8000)}${jobDescription.length > 8000 ? '...' : ''}

Return ONLY valid JSON, no markdown, no explanations.`;
  }

  private parseGroqResponse(content: string): ATSAnalysisResult {
    try {
      let jsonString = content.trim();
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/```\n?/g, '').replace(/```$/g, '');
      }
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }

      const parsed = JSON.parse(jsonString) as Partial<ATSAnalysisResult>;
      const result: ATSAnalysisResult = {
        score: Math.max(0, Math.min(100, parsed.score || 0)),
        improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
        missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords : [],
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        keywordMatch: parsed.keywordMatch !== undefined ? Math.max(0, Math.min(100, parsed.keywordMatch)) : undefined,
      };

      return result;
    } catch (error) {
      logger.error('Error parsing GROQ response:', error);
      logger.error('Response content:', content);
      return {
        score: 50,
        improvements: ['Unable to parse AI response. Please try again.'],
        missingKeywords: [],
        strengths: [],
      };
    }
  }
}

