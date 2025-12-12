import { IProfileRepository } from '../interfaces/IProfileRepository';
import { UserProfile, Education, Experience } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { injectable } from 'inversify';
import { ProfileData, ExperienceData, EducationData } from '../../services/interfaces/IProfileService';
import { BaseRepository } from './BaseRepository';

@injectable()
export class ProfileRepository extends BaseRepository<UserProfile> implements IProfileRepository {
  
  protected _getModel() {
    return prisma.userProfile as unknown as ReturnType<BaseRepository<UserProfile>['_getModel']>;
  }
  
  async createProfile(
    userId: string,
    profileData: ProfileData
  ): Promise<UserProfile> {
    console.log('ProfileRepository: createProfile called with userId:', userId);
    console.log('ProfileRepository: profileData:', profileData);
    
    const createData = {
      userId,
      headline: profileData.headline || null,
      about: profileData.about || null,
      location: profileData.location || null,
      phone: profileData.phone || null,
      profilePicture: profileData.profilePicture || null,
      skills: profileData.skills || [],
    };
    
    console.log('ProfileRepository: createData:', createData);
    
    const result = await prisma.userProfile.create({
      data: createData,
    });
    
    console.log('ProfileRepository: create result:', result);
    return result;
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return prisma.userProfile.findUnique({ 
      where: { userId } 
    });
  }

  async updateUserProfile(
    userId: string,
    profileData: Partial<ProfileData>
  ): Promise<UserProfile> {
    console.log(' ProfileRepository: updateUserProfile called with userId:', userId);
    console.log(' ProfileRepository: profileData:', JSON.stringify(profileData, null, 2));
    
    const updateData = {
      ...(profileData.headline !== undefined && { headline: profileData.headline }),
      ...(profileData.about !== undefined && { about: profileData.about }),
      ...(profileData.location !== undefined && { location: profileData.location }),
      ...(profileData.phone !== undefined && { phone: profileData.phone }),
      ...(profileData.profilePicture !== undefined && { profilePicture: profileData.profilePicture }),
      ...(profileData.skills !== undefined && { skills: profileData.skills }),
      updatedAt: new Date(),
    };
    
    console.log(' ProfileRepository: updateData:', JSON.stringify(updateData, null, 2));
    
    const result = await prisma.userProfile.update({
      where: { userId },
      data: updateData,
    });
    
    console.log('ProfileRepository: update result:', JSON.stringify(result, null, 2));
    return result;
  }

  async deleteProfile(userId: string): Promise<void> {
    await prisma.userProfile.delete({
      where: { userId },
    });
  }

  async getFullProfile(
    userId: string
  ): Promise<
    (UserProfile & { experience: Experience[]; education: Education[] }) | null
  > {
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
      include: {
        experience: true,
        education: true,
      },
    });

    
    return profile;
  }

 
  async addExperience(
    profileId: string,
    experienceData: ExperienceData
  ): Promise<Experience> {
    return prisma.experience.create({
      data: {
        profileId,
        title: experienceData.title,
        company: experienceData.company,
        location: experienceData.location || null,
        startDate: experienceData.startDate,
        endDate: experienceData.endDate || null,
        isCurrentRole: experienceData.isCurrentRole,
        description: experienceData.description || null,
      },
    });
  }

  async updateExperience(
    experienceId: string,
    experienceData: Partial<ExperienceData>
  ): Promise<Experience> {
    return prisma.experience.update({
      where: { id: experienceId },
      data: {
        ...(experienceData.title && { title: experienceData.title }),
        ...(experienceData.company && { company: experienceData.company }),
        ...(experienceData.location !== undefined && { location: experienceData.location }),
        ...(experienceData.startDate && { startDate: experienceData.startDate }),
        ...(experienceData.endDate !== undefined && { endDate: experienceData.endDate }),
        ...(experienceData.isCurrentRole !== undefined && { isCurrentRole: experienceData.isCurrentRole }),
        ...(experienceData.description !== undefined && { description: experienceData.description }),
        updatedAt: new Date(),
      },
    });
  }

  async deleteExperience(experienceId: string): Promise<void> {
    await prisma.experience.delete({
      where: { id: experienceId },
    });
  }

  async getExperienceById(experienceId: string): Promise<Experience | null> {
    return prisma.experience.findUnique({
      where: { id: experienceId },
    });
  }

  async addEducation(
    profileId: string,
    educationData: EducationData
  ): Promise<Education> {
    return prisma.education.create({
      data: {
        profileId,
        institution: educationData.institution, 
        degree: educationData.degree,
        startDate: educationData.startDate,
        endDate: educationData.endDate || null,
      },
    });
  }

  async updateEducation(
    educationId: string,
    educationData: Partial<EducationData>
  ): Promise<Education> {
    return prisma.education.update({
      where: { id: educationId },
      data: {
        ...(educationData.institution && { institution: educationData.institution }),
        ...(educationData.degree && { degree: educationData.degree }),
        ...(educationData.startDate && { startDate: educationData.startDate }),
        ...(educationData.endDate !== undefined && { endDate: educationData.endDate }),
        updatedAt: new Date(),
      },
    });
  }

  async deleteEducation(educationId: string): Promise<void> {
    await prisma.education.delete({
      where: { id: educationId },
    });
  }

  async getEducationById(educationId: string): Promise<Education | null> {
    return prisma.education.findUnique({
      where: { id: educationId },
    });
  }
}