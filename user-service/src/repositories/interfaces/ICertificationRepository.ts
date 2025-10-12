import { Certification } from '../../types/certification';

export interface ICertificationRepository {
  addCertification(userId: string, certification: Omit<Certification, 'id'>): Promise<Certification>;
  getCertifications(userId: string): Promise<Certification[]>;
  updateCertification(userId: string, certificationId: string, updates: Partial<Certification>): Promise<Certification>;
  deleteCertification(userId: string, certificationId: string): Promise<void>;
  getCertificationById(userId: string, certificationId: string): Promise<Certification | null>;
}