import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

export class AiService {
  private groq: Groq;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not set in environment variables');
    }
    this.groq = new Groq({ apiKey });
  }

  async analyzeResume(resumeText: string, jobDescription: string): Promise<any> {
    const prompt = `
      You are an expert ATS (Applicant Tracking System) scanner. 
      Analyze the following Resume against the Job Description.
      
      Resume:
      ${resumeText}
      
      Job Description:
      ${jobDescription}
      
      Provide the output in the following JSON format ONLY (no markdown, no code blocks, just pure JSON):
      {
        "score": number (0-100),
        "matchingKeywords": string[],
        "missingKeywords": string[],
        "analysis": string (brief summary),
        "recommendations": string[] (3-5 actionable tips)
      }
    `;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a helpful ATS assistant that responds only in valid JSON.' },
          { role: 'user', content: prompt }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from AI');
      }

      // Clean up json if wrapped in markdown code blocks
      const cleanedContent = content
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      return JSON.parse(cleanedContent);

    } catch (error) {
      console.error('Error in AI analysis:', error);
      throw new Error('Failed to analyze resume with AI');
    }
  }
}
