import { UserResponse, ProfileResponse } from '../responses/user.response';
import { User } from '@prisma/client';

export function mapUserToResponse(user: User): UserResponse {
  return {
    id: user.id,
    username: user.name,  
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    isBlocked: user.isBlocked,
    createdAt: user.createdAt,
    updatedAt: user.createdAt 
  };
}

export function mapUserToAuthResponse(user: User, tokens: { accessToken: string; refreshToken: string }) {
  return {
    user: mapUserToResponse(user),  
    tokens
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


export function mapUsersToResponse(users: User[]): UserResponse[] {
  return users.map(mapUserToResponse);
}