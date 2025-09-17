import { injectable, inject } from 'inversify';
import { ICertificationService } from './ICertificationService';
import { ICertificationRepository } from '../repositories/ICertificationRepository';
import { Certification, CreateCertificationRequest, UpdateCertificationRequest } from '../types/certification';
import { CreateCertificationSchema, UpdateCertificationSchema } from '../dto/schemas/certification.schema';

@injectable()
export class CertificationService implements ICertificationService {
  constructor(
    @inject('ICertificationRepository') private certificationRepository: ICertificationRepository
  ) {}

  private validateAndCleanCertificationData(data: CreateCertificationRequest): CreateCertificationRequest {
    // Validate and clean data using Zod
    const validatedData = CreateCertificationSchema.parse(data);
    
    // Additional business logic validation
    if (validatedData.expiry_date && validatedData.issue_date) {
      const issueDate = new Date(validatedData.issue_date);
      const expiryDate = new Date(validatedData.expiry_date);
      if (expiryDate <= issueDate) {
        throw new Error('Expiry date must be after issue date');
      }
    }

    return validatedData;
  }

  private async checkDuplicateCertification(userId: string, data: CreateCertificationRequest): Promise<void> {
    const existingCertifications = await this.certificationRepository.getCertifications(userId);
    
    const isDuplicate = existingCertifications.some(cert => 
      cert.name.toLowerCase() === data.name.toLowerCase() &&
      cert.issuer.toLowerCase() === data.issuer.toLowerCase() &&
      cert.issue_date === data.issue_date
    );

    if (isDuplicate) {
      throw new Error('This certification already exists');
    }
  }

  async addCertification(userId: string, certificationData: CreateCertificationRequest): Promise<Certification> {
    // Validate and clean data using Zod
    const validatedData = this.validateAndCleanCertificationData(certificationData);

    // Check for duplicates
    await this.checkDuplicateCertification(userId, validatedData);

    // Add certification
    return this.certificationRepository.addCertification(userId, validatedData);
  }

  async getCertifications(userId: string): Promise<Certification[]> {
    const certifications = await this.certificationRepository.getCertifications(userId);
    
    // Sort by issue date (newest first)
    return certifications.sort((a, b) => 
      new Date(b.issue_date).getTime() - new Date(a.issue_date).getTime()
    );
  }

async updateCertification(userId: string, certificationId: string, updates: UpdateCertificationRequest): Promise<Certification> {
  // Check if certification exists
  const existingCertification = await this.certificationRepository.getCertificationById(userId, certificationId);
  if (!existingCertification) {
    throw new Error('Certification not found');
  }

  // Validate updates using Zod
  console.log('🔍 [CERTIFICATION-SERVICE] Validating updates:', JSON.stringify(updates, null, 2));
  const validatedUpdates = UpdateCertificationSchema.parse(updates);
  console.log('🔍 [CERTIFICATION-SERVICE] Validated updates:', JSON.stringify(validatedUpdates, null, 2));

  // Additional business logic validation for combined data
  if (validatedUpdates.issue_date || validatedUpdates.expiry_date) {
    const issueDate = new Date(validatedUpdates.issue_date || existingCertification.issue_date);
    const expiryDate = validatedUpdates.expiry_date || existingCertification.expiry_date;
    
    if (expiryDate) {
      const expiryDateObj = new Date(expiryDate);
      if (expiryDateObj <= issueDate) {
        throw new Error('Expiry date must be after issue date');
      }
    }
  }

  // Check for duplicates (excluding current certification)
  if (validatedUpdates.name || validatedUpdates.issuer || validatedUpdates.issue_date) {
    const existingCertifications = await this.certificationRepository.getCertifications(userId);
    const otherCertifications = existingCertifications.filter(cert => cert.id !== certificationId);
    
    const isDuplicate = otherCertifications.some(cert => 
      cert.name.toLowerCase() === (validatedUpdates.name || existingCertification.name).toLowerCase() &&
      cert.issuer.toLowerCase() === (validatedUpdates.issuer || existingCertification.issuer).toLowerCase() &&
      cert.issue_date === (validatedUpdates.issue_date || existingCertification.issue_date)
    );

    if (isDuplicate) {
      throw new Error('This certification already exists');
    }
  }

  return this.certificationRepository.updateCertification(userId, certificationId, validatedUpdates);
}

  async deleteCertification(userId: string, certificationId: string): Promise<void> {
    // Check if certification exists
    const existingCertification = await this.certificationRepository.getCertificationById(userId, certificationId);
    if (!existingCertification) {
      throw new Error('Certification not found');
    }

    return this.certificationRepository.deleteCertification(userId, certificationId);
  }

  async getCertificationById(userId: string, certificationId: string): Promise<Certification | null> {
    return this.certificationRepository.getCertificationById(userId, certificationId);
  }
}
