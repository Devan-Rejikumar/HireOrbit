export interface IEducation {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string; 
  startDate: Date;
  endDate?: Date;
  grade?: string; 
  description?: string; 
}

export interface IExperience {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
  isCurrentRole: boolean;
}

export interface IUserProfile {
  id: string;
  userId: string;
  headline: string | null; 
  about: string | null;    
  profilePicture: string | null; 
  resume: string | null;
  location: string | null; 
  phone: string | null;    
  experience: IExperience[];
  education: IEducation[];
  skills: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileData {
  headline?: string;
  about?: string;
  profilePicture?: string;
  location?: string;
  phone?: string;
  skills?: string[];
}

export interface UserProfile {
  id: string;
  userId: string;
  headline: string | null;
  about: string | null;
  location: string | null;
  phone: string | null;
  profilePicture: string | null;
  resume: string | null;
  skills: string[];
  createdAt: Date;
  updatedAt: Date;
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

export interface FullUserProfile extends UserProfile {
  experience: IExperience[];
  education: IEducation[];
}