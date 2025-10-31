import { UserProfile, Education, Experience } from '@prisma/client';
import { ProfileData, ExperienceData, EducationData } from '../../services/interfaces/IProfileService';

export interface IProfileRepository {
  
  createProfile(userId: string, profileData: ProfileData): Promise<UserProfile>;
  getUserProfile(userId: string): Promise<UserProfile | null>;
  updateUserProfile(userId: string, profileData: Partial<ProfileData>): Promise<UserProfile>;
  deleteProfile(userId: string): Promise<void>;
  getFullProfile(userId: string): Promise<UserProfile & {
    experience: Experience[];
    education: Education[];
  } | null>;


  addExperience(profileId: string, experienceData: ExperienceData): Promise<Experience>;
  updateExperience(experienceId: string, experienceData: Partial<ExperienceData>): Promise<Experience>;
  deleteExperience(experienceId: string): Promise<void>;
  getExperienceById(experienceId: string): Promise<Experience | null>;

  
  addEducation(profileId: string, educationData: EducationData): Promise<Education>;
  updateEducation(educationId: string, educationData: Partial<EducationData>): Promise<Education>;
  deleteEducation(educationId: string): Promise<void>;
  getEducationById(educationId: string): Promise<Education | null>;
}