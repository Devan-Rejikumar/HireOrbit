import { injectable } from 'inversify';
import { ICertificationRepository } from './ICertificationRepository';
import { Certification } from '../types/certification';
import { prisma } from '../prisma/client';
import { v4 as uuidv4 } from 'uuid';

@injectable()
export class CertificationRepository implements ICertificationRepository {
  async addCertification(userId: string, certification: Omit<Certification, 'id'>): Promise<Certification> {
    const newCertification = {
      id: uuidv4(),
      ...certification
    };

    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      throw new Error('User profile not found');
    }

    const currentCertifications = (profile.certifications as unknown as Certification[]) || [];
    const updatedCertifications = [...currentCertifications, newCertification];

    await prisma.userProfile.update({
      where: { userId },
      data: { certifications: JSON.parse(JSON.stringify(updatedCertifications)) }
    });

    return newCertification;
  }

  async getCertifications(userId: string): Promise<Certification[]> {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      select: { certifications: true }
    });

    return (profile?.certifications as unknown as Certification[]) || [];
  }

  async updateCertification(userId: string, certificationId: string, updates: Partial<Certification>): Promise<Certification> {
    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      throw new Error('User profile not found');
    }

    const certifications = (profile.certifications as unknown as Certification[]) || [];
    const certificationIndex = certifications.findIndex(cert => cert.id === certificationId);

    if (certificationIndex === -1) {
      throw new Error('Certification not found');
    }

    certifications[certificationIndex] = { ...certifications[certificationIndex], ...updates };
    const updatedCertification = certifications[certificationIndex];

    await prisma.userProfile.update({
      where: { userId },
      data: { certifications: JSON.parse(JSON.stringify(certifications)) }
    });

    return updatedCertification;
  }

  async deleteCertification(userId: string, certificationId: string): Promise<void> {
    const profile = await prisma.userProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      throw new Error('User profile not found');
    }

    const certifications = (profile.certifications as unknown as Certification[]) || [];
    const filteredCertifications = certifications.filter(cert => cert.id !== certificationId);

    await prisma.userProfile.update({
      where: { userId },
      data: { certifications: JSON.parse(JSON.stringify(filteredCertifications)) }
    });
  }

  async getCertificationById(userId: string, certificationId: string): Promise<Certification | null> {
    const certifications = await this.getCertifications(userId);
    return certifications.find(cert => cert.id === certificationId) || null;
  }
}