import { Certification, CreateCertificationRequest, UpdateCertificationRequest } from '../types/certification';

export interface ICertificationService {
  addCertification(userId: string, certificationData: CreateCertificationRequest): Promise<Certification>;
  getCertifications(userId: string): Promise<Certification[]>;
  updateCertification(userId: string, certificationId: string, updates: UpdateCertificationRequest): Promise<Certification>;
  deleteCertification(userId: string, certificationId: string): Promise<void>;
  getCertificationById(userId: string, certificationId: string): Promise<Certification | null>;
}
