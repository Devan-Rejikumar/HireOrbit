import { UserProfile, Experience, Education } from '@prisma/client';

export interface ProfileData {
  headline?: string;
  about?: string;
  profilePicture?: string;
  location?: string;
  phone?: string;
  skills?: string[];
}

export interface ExperienceData {
  title: string;
  company: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  isCurrentRole: boolean;
  description?: string;
}

export interface EducationData {
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate: Date;
  endDate?: Date;
  grade?: string;
  description?: string;
}

export interface IProfileService {
  createProfile(userId: string, profileData: ProfileData): Promise<UserProfile>;
  getProfile(userId: string): Promise<UserProfile | null>;
  updateProfile(userId: string, profileData: Partial<ProfileData>): Promise<UserProfile>;
  deleteProfile(userId: string): Promise<void>;
  getFullProfile(userId: string): Promise<UserProfile & {
    experience: Experience[];
    education: Education[];
  } | null>;
  addExperience(userId: string, experienceData: ExperienceData): Promise<Experience>;
  updateExperience(userId: string, experienceId: string, experienceData: Partial<ExperienceData>): Promise<Experience>;
  deleteExperience(userId: string, experienceId: string): Promise<void>;
  addEducation(userId: string, educationData: EducationData): Promise<Education>;
  updateEducation(userId: string, educationId: string, educationData: Partial<EducationData>): Promise<Education>;
  deleteEducation(userId: string, educationId: string): Promise<void>;
}