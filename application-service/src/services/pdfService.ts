import fs from 'fs';
import pdfParse from 'pdf-parse';

export class PdfService {
  // Parse PDF from file path (legacy method)
  async parsePdf(filePath: string): Promise<string> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error('Failed to parse PDF file');
    }
  }

  // Parse PDF from Buffer (for base64 decoded content)
  async parsePdfFromBuffer(buffer: Buffer): Promise<string> {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      console.error('Error parsing PDF from buffer:', error);
      throw new Error('Failed to parse PDF file');
    }
  }
}
