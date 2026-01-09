export interface UserResponse {
  id: string;
  username: string;
  email: string;
  role: string;
  isVerified: boolean;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileResponse {
  id: string;
  userId: string;
  headline?: string;
  about?: string;
  profilePicture?: string;
  location?: string;
  phone?: string;
  experience: ExperienceResponse[];
  education: EducationResponse[];
  skills: string[];
  completionPercentage: number;
}

export interface ExperienceResponse {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description?: string;
  isCurrentRole: boolean;
}

export interface EducationResponse {
  id: string;
  institution: string;
  degree: string;
  startDate: string;
  endDate?: string;
}

export interface AuthResponse {
  user: UserResponse;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}