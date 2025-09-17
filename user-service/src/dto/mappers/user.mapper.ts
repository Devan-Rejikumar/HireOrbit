import { UserResponse, ProfileResponse, ExperienceResponse, EducationResponse } from '../responses/user.response';


export function mapUserToResponse(user: {
  id: string;
  username: string;
  email: string;
  role: string;
  isVerified: boolean;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}): UserResponse {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    isBlocked: user.isBlocked,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}


export function mapProfileToResponse(profile: {
  id: string;
  userId: string;
  headline?: string;
  about?: string;
  profilePicture?: string;
  location?: string;
  phone?: string;
  experience: Array<{
    id: string;
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    description?: string;
    isCurrentRole: boolean;
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    startDate: string;
    endDate?: string;
  }>;
  skills: string[];
  completionPercentage: number;
}): ProfileResponse {
  return {
    id: profile.id,
    userId: profile.userId,
    headline: profile.headline,
    about: profile.about,
    profilePicture: profile.profilePicture,
    location: profile.location,
    phone: profile.phone,
    experience: profile.experience.map(exp => ({
      id: exp.id,
      title: exp.title,
      company: exp.company,
      location: exp.location,
      startDate: exp.startDate,
      endDate: exp.endDate,
      description: exp.description,
      isCurrentRole: exp.isCurrentRole
    })),
    education: profile.education.map(edu => ({
      id: edu.id,
      institution: edu.institution,
      degree: edu.degree,
      startDate: edu.startDate,
      endDate: edu.endDate
    })),
    skills: profile.skills,
    completionPercentage: profile.completionPercentage
  };
}


export function mapUsersToResponse(users: Array<{
  id: string;
  username: string;
  email: string;
  role: string;
  isVerified: boolean;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}>): UserResponse[] {
  return users.map(mapUserToResponse);
}