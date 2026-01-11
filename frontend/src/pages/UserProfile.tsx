import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  MapPin,
  Phone,
  Mail,
  Briefcase,
  GraduationCap,
  Calendar,
  Edit,
  Award,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Home,
  Search,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react';
import api from '../api/axios';
import Header from '@/components/Header';
import EditProfileModal from '../components/EditProfileModal';
import SkillsModal from '../components/SkillsModal';
import ExperienceModal from '../components/ExperienceModal';
import EducationModal from '../components/EducationModal';
import ResumeUpload from '../components/ResumeUpload';
import { userService } from '../api/userService';
import toast from 'react-hot-toast';
import CertificationModal from '@/components/CertificationModal';
import AchievementModal from '@/components/AchievementModal';
import VerificationModal from '@/components/VerificationModal';

// Helper function to extract error message from unknown error
const extractErrorMessage = (error: unknown, defaultMessage: string): string => {
  const isAxiosError = error && typeof error === 'object' && 'response' in error;
  const axiosError = isAxiosError ? (error as { response?: { data?: { error?: string; message?: string } }; message?: string }) : null;
  
  if (axiosError?.response?.data?.error) {
    try {
      // Try to parse Zod validation errors
      const errorData = JSON.parse(axiosError.response.data.error);
      if (Array.isArray(errorData) && errorData.length > 0) {
        // Extract the first validation error message
        return errorData[0].message || 'Validation error';
      } else {
        return axiosError.response.data.error;
      }
    } catch {
      // If parsing fails, use the raw error
      return axiosError.response.data.error;
    }
  } else if (axiosError?.response?.data?.message) {
    return axiosError.response.data.message;
  } else if (axiosError?.message) {
    return axiosError.message;
  }
  
  return defaultMessage;
};

interface Experience {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  description?: string;
  isCurrentRole: boolean;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  startDate: string;
  endDate?: string;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
  description?: string;
  certificate_file?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  achievement_file?: string;
}

interface UserProfile {
  id: string;
  userId: string;
  headline?: string;
  about?: string;
  profilePicture?: string;
  location?: string;
  phone?: string;
  resume?: string;
  experience: Experience[];
  education: Education[];
  certifications?: Certification[];
  achievements?: Achievement[];
  skills: string[];
}

interface UserData {
  id: string;
  username: string;
  email: string;
  isVerified: boolean;
}

interface ProfileResponse {
  success: boolean;
  data: {
    profile: UserProfile;
    user: UserData;
    completionPercentage: number;
  };
  message: string;
  timestamp: string;
}

const UserProfile = () => {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState<Education | null>(null);
  const [isCertificationModalOpen, setIsCertificationModalOpen] = useState(false);
  const [editingCertification, setEditingCertification] = useState<Certification | null>(null);
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [isResumeUploading, setIsResumeUploading] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get<ProfileResponse>('/profile/full');
      setProfileData(response.data.data);
    } catch (error) {
      // Error handled silently - user will see loading state
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  const calculateDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0)
      return `${remainingMonths} month${remainingMonths !== 1 ? 's' : ''}`;
    if (remainingMonths === 0) return `${years} year${years !== 1 ? 's' : ''}`;
    return `${years} year${years !== 1 ? 's' : ''} ${remainingMonths} month${
      remainingMonths !== 1 ? 's' : ''
    }`;
  };

  const handleResumeUpload = async (file: File) => {
    setIsResumeUploading(true);
    try {
      await userService.uploadResume(file);
      await fetchProfile();
    } catch (error) {
      throw error;
    } finally {
      setIsResumeUploading(false);
    }
  };

  const handleResumeDelete = async () => {
    setIsResumeUploading(true);
    try {
      await userService.deleteResume();
      await fetchProfile(); 
    } catch (error) {
      throw error;
    } finally {
      setIsResumeUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Profile not found</h2>
          <p className="text-gray-600">Please complete your profile setup.</p>
        </div>
      </div>
    );
  }

  const { profile, user, completionPercentage } = profileData || { profile: null, user: null, completionPercentage: 0 };

  const refreshProfile = () => {
    fetchProfile();
  };

  interface ProfileUpdateData {
    headline?: string;
    about?: string;
    location?: string;
    phone?: string;
    profilePicture?: string;
  }

  const handleSaveProfile = async (profileData: ProfileUpdateData) => {
    try {
      // Always send as JSON now - no more multipart/form-data
      const response = await api.put('/profile/', profileData, {
        headers: { 'Content-Type': 'application/json' },
      });

      const responseData = response.data as {
        success: boolean;
        data: {
          profile: {
            headline?: string;
            about?: string;
            location?: string;
            phone?: string;
            profilePicture?: string;
          };
        };
        message: string;
      };

      if (responseData?.success) {
        await fetchProfile();
        toast.success('Profile updated successfully!');
      }
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error, 'Failed to update profile'));
    }
  };

  const handleAddCertification = async (certification: Omit<Certification, 'id'>) => {
    try {
      const response = await api.post('/profile/certifications', certification);
      if ((response.data as { success: boolean }).success) {
        toast.success('Certification added successfully!');
        await fetchProfile();
      }
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, 'Failed to add certification'));
    }
  };

  const handleDeleteCertification = async (certificationId: string) => {
    try {
      const response = await api.delete(`/profile/certifications/${certificationId}`);
      if ((response.data as { success: boolean }).success) {
        toast.success('Certification deleted successfully!');
        await fetchProfile();
      }
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, 'Failed to delete certification'));
    }
  };

  const handleUpdateCertification = async (certification: Omit<Certification, 'id'>) => {
    if (!editingCertification) return;
    
    try {
      const response = await api.put(`/profile/certifications/${editingCertification.id}`, certification);
      if ((response.data as { success: boolean }).success) {
        toast.success('Certification updated successfully!');
        await fetchProfile();
      }
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, 'Failed to update certification'));
    }
  };

  const handleAddAchievement = async (achievement: Omit<Achievement, 'id'>) => {
    try {
      const response = await api.post('/profile/achievements', achievement);
      if ((response.data as { success: boolean }).success) {
        toast.success('Achievement added successfully!');
        await fetchProfile();
      }
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, 'Failed to add achievement'));
    }
  };

  const handleDeleteAchievement = async (achievementId: string) => {
    try {
      const response = await api.delete(`/profile/achievements/${achievementId}`);
      if ((response.data as { success: boolean }).success) {
        toast.success('Achievement deleted successfully!');
        await fetchProfile();
      }
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, 'Failed to delete achievement'));
    }
  };

  const handleUpdateAchievement = async (achievement: Omit<Achievement, 'id'>) => {
    if (!editingAchievement) return;
    
    try {
      const response = await api.put(`/profile/achievements/${editingAchievement.id}`, achievement);
      if ((response.data as { success: boolean }).success) {
        toast.success('Achievement updated successfully!');
        await fetchProfile();
      }
    } catch (error: unknown) {
      toast.error(extractErrorMessage(error, 'Failed to update achievement'));
    }
  };


  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-14 sm:pt-16 pb-20 lg:pb-8">
        {/* Back Button for Mobile */}
        <button
          onClick={() => navigate('/user/dashboard')}
          className="lg:hidden fixed top-16 left-4 z-40 bg-white shadow-lg rounded-full p-2.5 border border-gray-200 hover:bg-gray-50 transition-all duration-200"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>

        <div className="max-w-6xl mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6">
          {/* Profile Header Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl mb-4 sm:mb-6 lg:mb-8 overflow-hidden border border-gray-100">
            {/* Cover Photo */}
            <div className="h-28 sm:h-36 lg:h-48 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
              <div className="absolute inset-0 bg-black/10"></div>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
              <div className="flex flex-col lg:flex-row lg:items-start -mt-12 sm:-mt-16 lg:-mt-20 mb-4 sm:mb-6">
                {/* Profile Picture */}
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 bg-white rounded-xl sm:rounded-2xl border-4 border-white shadow-xl flex items-center justify-center">
                    {profile.profilePicture ? (
                      <img
                        src={profile.profilePicture}
                        alt={user.username}
                        className="w-full h-full rounded-lg sm:rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                        <User className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Completion Card - Circular Gauge (Hidden on small mobile, shown on tablet+) */}
                <div className="hidden sm:block lg:ml-auto mt-4 lg:mt-16">
                  <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 border border-gray-200 shadow-lg">
                    <div className="text-center">
                      {/* Circular Gauge */}
                      <div className="relative w-36 h-24 sm:w-44 sm:h-28 lg:w-56 lg:h-36 mx-auto mb-2 sm:mb-4">
                        <svg className="w-full h-full" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet">
                          <defs>
                            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.9" />
                              <stop offset="50%" stopColor="#9333ea" stopOpacity="1" />
                              <stop offset="100%" stopColor="#c084fc" stopOpacity="1" />
                            </linearGradient>
                          </defs>
                          
                          {/* Background Arc */}
                          <path
                            d="M 20 100 A 80 80 0 0 1 180 100"
                            fill="none"
                            stroke="#e5e7eb"
                            strokeWidth="14"
                            strokeLinecap="round"
                          />
                          
                          {/* Progress Arc with Gradient */}
                          <path
                            d="M 20 100 A 80 80 0 0 1 180 100"
                            fill="none"
                            stroke="url(#progressGradient)"
                            strokeWidth="14"
                            strokeLinecap="round"
                            strokeDasharray="251.2"
                            strokeDashoffset={251.2 - (completionPercentage / 100) * 251.2}
                            style={{
                              transition: 'stroke-dashoffset 0.7s ease-out',
                              filter: 'drop-shadow(0 0 2px rgba(168, 85, 247, 0.3))',
                            }}
                          />
                          
                          {/* White dots scattered on progress arc */}
                          {Array.from({ length: Math.floor(completionPercentage / 3) }).map((_, i) => {
                            const progress = (i * 3 / 100);
                            if (progress > completionPercentage / 100) return null;
                            const angle = progress * Math.PI;
                            const x = 100 + 80 * Math.cos(Math.PI - angle);
                            const y = 100 - 80 * Math.sin(Math.PI - angle);
                            const randomOffset = (Math.random() - 0.5) * 4;
                            return (
                              <circle
                                key={i}
                                cx={x + randomOffset}
                                cy={y + randomOffset}
                                r="1.5"
                                fill="white"
                                opacity={0.7 + Math.random() * 0.3}
                              />
                            );
                          })}
                          
                          {/* Tick Marks */}
                          {Array.from({ length: 11 }).map((_, i) => {
                            const angle = (i / 10) * Math.PI;
                            const x1 = 100 + 72 * Math.cos(Math.PI - angle);
                            const y1 = 100 - 72 * Math.sin(Math.PI - angle);
                            const x2 = 100 + 88 * Math.cos(Math.PI - angle);
                            const y2 = 100 - 88 * Math.sin(Math.PI - angle);
                            return (
                              <line
                                key={i}
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke="#d1d5db"
                                strokeWidth="1.5"
                              />
                            );
                          })}
                          
                          {/* Needle */}
                          <g>
                            <line
                              x1="100"
                              y1="100"
                              x2="100"
                              y2="25"
                              stroke="#1f2937"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              transform={`rotate(${-90 + (completionPercentage / 100) * 180} 100 100)`}
                              style={{
                                transition: 'transform 0.7s ease-out',
                              }}
                            />
                            <circle
                              cx="100"
                              cy="100"
                              r="5"
                              fill="#1f2937"
                            />
                          </g>
                        </svg>
                        
                        {/* Center Text */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pt-6 sm:pt-8 lg:pt-10">
                          <div className="text-2xl sm:text-3xl lg:text-5xl font-bold text-gray-900 mb-0.5 sm:mb-1">
                            {completionPercentage}
                          </div>
                          <div className="text-xs sm:text-sm lg:text-lg font-semibold text-gray-800 mb-0.5 sm:mb-1">
                            {completionPercentage === 100 
                              ? 'Complete' 
                              : completionPercentage >= 70 
                                ? 'Stable state'
                                : completionPercentage >= 40
                                  ? 'In progress'
                                  : 'Getting started'}
                          </div>
                          <div className="text-[10px] sm:text-xs lg:text-sm text-gray-500 hidden sm:block">
                            {completionPercentage === 100 
                              ? 'Perfect profile!' 
                              : 'Keep going'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile: Simple Progress Bar */}
              <div className="sm:hidden mb-4">
                <div className="bg-gray-100 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Profile Completion</span>
                    <span className="text-lg font-bold text-purple-600">{completionPercentage}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                  {user.username}
                </h1>
                <p className="text-sm sm:text-lg lg:text-xl text-gray-600 mb-3 sm:mb-4 font-medium">
                  {profile.headline || 'Add a professional headline'}
                </p>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-6 text-gray-600">
                  {profile.location && (
                    <div className="flex items-center bg-gray-50 px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-blue-600" />
                      <span className="text-xs sm:text-sm lg:text-base font-medium">{profile.location}</span>
                    </div>
                  )}
                  <div className="flex items-center bg-gray-50 px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl">
                    <Mail className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-blue-600" />
                    <span className="text-xs sm:text-sm lg:text-base font-medium truncate max-w-[140px] sm:max-w-none">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl">
                    <div className="flex items-center">
                      {user.isVerified ? (
                        <>
                          <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-green-600" />
                          <span className="text-xs sm:text-sm lg:text-base font-medium text-green-600">Verified</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-orange-600" />
                          <span className="text-xs sm:text-sm lg:text-base font-medium text-orange-600 hidden sm:inline">Not Verified</span>
                        </>
                      )}
                    </div>
                    {!user.isVerified && (
                      <button
                        onClick={() => setIsVerificationModalOpen(true)}
                        className="text-[10px] sm:text-xs lg:text-sm bg-orange-600 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        Verify
                      </button>
                    )}
                  </div>
                  {profile.phone && (
                    <div className="flex items-center bg-gray-50 px-2.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl">
                      <Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 text-blue-600" />
                      <span className="text-xs sm:text-sm lg:text-base font-medium">{profile.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 sm:gap-4">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold flex items-center justify-center text-sm sm:text-base"
                >
                  <Edit className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                  Edit Profile
                </button>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <>
            {/* About Section */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg mb-4 sm:mb-6 lg:mb-8 p-4 sm:p-6 lg:p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg sm:rounded-xl flex items-center justify-center mr-3 sm:mr-4">
                    <User className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">About</h2>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg sm:rounded-xl p-4 sm:p-6">
                <p className="text-sm sm:text-base lg:text-lg text-gray-700 leading-relaxed">
                  {profile.about ||
                  'Add a summary to highlight your personality or work experience'}
                </p>
              </div>
            </div>

            {/* Resume Section */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg mb-4 sm:mb-6 lg:mb-8 p-4 sm:p-6 lg:p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg sm:rounded-xl flex items-center justify-center mr-3 sm:mr-4">
                    <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Resume</h2>
                </div>
              </div>
            
              <ResumeUpload
                onUpload={handleResumeUpload}
                onDelete={handleResumeDelete}
                currentResume={profile.resume}
                isLoading={isResumeUploading}
              />
            </div>

            {/* Experience Section */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg mb-4 sm:mb-6 lg:mb-8 p-4 sm:p-6 lg:p-8 border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6 lg:mb-8">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg sm:rounded-xl flex items-center justify-center mr-3 sm:mr-4">
                    <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Experience</h2>
                </div>
                <button
                  onClick={() => {
                    setEditingExperience(null);
                    setIsExperienceModalOpen(true);
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold flex items-center justify-center text-sm sm:text-base"
                >
                  <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                Add Experience
                </button>
              </div>

              {(!profile.experience || profile.experience.length === 0) ? (
                <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg sm:rounded-xl">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Briefcase className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm sm:text-lg mb-1 sm:mb-2">No experience added yet</p>
                  <p className="text-gray-400 text-xs sm:text-sm px-4">Add your work experience to showcase your professional journey</p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                  {profile.experience?.map((exp, index) => (
                    <div
                      key={exp.id}
                      className={`${index !== 0 ? 'border-t border-gray-200 pt-4 sm:pt-6 lg:pt-8' : ''}`}
                    >
                      <div className="flex items-start">
                        <div className="hidden sm:flex w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl lg:rounded-2xl items-center justify-center mr-4 lg:mr-6 flex-shrink-0 shadow-lg">
                          <Briefcase className="h-6 w-6 lg:h-8 lg:w-8 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-0.5 sm:mb-1">
                                {exp.title}
                              </h3>
                              <p className="text-sm sm:text-base lg:text-lg text-gray-600 font-medium mb-1 sm:mb-2">{exp.company}</p>
                              {exp.location && (
                                <div className="flex items-center text-gray-500 mb-2 sm:mb-3">
                                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  <span className="text-xs sm:text-sm">{exp.location}</span>
                                </div>
                              )}
                              <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 mb-2 sm:mb-4">
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                  <span className="font-medium">
                                    {formatDate(exp.startDate)} -{' '}
                                    {exp.isCurrentRole
                                      ? 'Present'
                                      : exp.endDate
                                        ? formatDate(exp.endDate)
                                        : 'Present'}
                                  </span>
                                </div>
                                <span className="text-gray-300 hidden sm:inline">•</span>
                                <span className="font-medium text-purple-600">
                                  {calculateDuration(
                                    exp.startDate,
                                    exp.isCurrentRole ? undefined : exp.endDate,
                                  )}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setEditingExperience(exp);
                                setIsExperienceModalOpen(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                            >
                              <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                          </div>
                          {exp.description && (
                            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 mt-2 sm:mt-4">
                              <p className="text-xs sm:text-sm lg:text-base text-gray-700 leading-relaxed">
                                {exp.description}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Education Section */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg mb-4 sm:mb-6 lg:mb-8 p-4 sm:p-6 lg:p-8 border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6 lg:mb-8">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-100 to-blue-100 rounded-lg sm:rounded-xl flex items-center justify-center mr-3 sm:mr-4">
                    <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                  </div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Education</h2>
                </div>
                <button
                  onClick={() => {
                    setEditingEducation(null);
                    setIsEducationModalOpen(true);
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold flex items-center justify-center text-sm sm:text-base"
                >
                  <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                Add Education
                </button>
              </div>

              {(!profile.education || profile.education.length === 0) ? (
                <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg sm:rounded-xl">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <GraduationCap className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm sm:text-lg mb-1 sm:mb-2">No education added yet</p>
                  <p className="text-gray-400 text-xs sm:text-sm px-4">Add your educational background to showcase your qualifications</p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                  {profile.education?.map((edu, index) => (
                    <div
                      key={edu.id}
                      className={`${index !== 0 ? 'border-t border-gray-200 pt-4 sm:pt-6 lg:pt-8' : ''}`}
                    >
                      <div className="flex items-start">
                        <div className="hidden sm:flex w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-indigo-100 to-blue-100 rounded-xl lg:rounded-2xl items-center justify-center mr-4 lg:mr-6 flex-shrink-0 shadow-lg">
                          <GraduationCap className="h-6 w-6 lg:h-8 lg:w-8 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-0.5 sm:mb-1">
                                {edu.institution}
                              </h3>
                              <p className="text-sm sm:text-base lg:text-lg text-gray-600 font-medium mb-2 sm:mb-3">{edu.degree}</p>
                              <div className="flex items-center text-xs sm:text-sm text-gray-500">
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                <span className="font-medium">
                                  {formatDate(edu.startDate)} -{' '}
                                  {edu.endDate
                                    ? formatDate(edu.endDate)
                                    : 'Present'}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setEditingEducation(edu);
                                setIsEducationModalOpen(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                            >
                              <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Skills Section */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg mb-4 sm:mb-6 lg:mb-8 p-4 sm:p-6 lg:p-8 border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6 lg:mb-8">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg sm:rounded-xl flex items-center justify-center mr-3 sm:mr-4">
                    <Award className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                  </div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Skills</h2>
                </div>
                <button
                  onClick={() => setIsSkillsModalOpen(true)}
                  className="w-full sm:w-auto bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold flex items-center justify-center text-sm sm:text-base"
                >
                  <Award className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                Add Skills
                </button>
              </div>

              {(!profile.skills || profile.skills.length === 0) ? (
                <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg sm:rounded-xl">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Award className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm sm:text-lg mb-1 sm:mb-2">No skills added yet</p>
                  <p className="text-gray-400 text-xs sm:text-sm px-4">Add your skills to showcase your expertise</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {profile.skills?.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold border border-orange-200 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Certifications Section */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg mb-4 sm:mb-6 lg:mb-8 p-4 sm:p-6 lg:p-8 border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6 lg:mb-8">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-emerald-100 to-green-100 rounded-lg sm:rounded-xl flex items-center justify-center mr-3 sm:mr-4">
                    <Award className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                  </div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Certifications</h2>
                </div>
                <button
                  onClick={() => {
                    setEditingCertification(null);
                    setIsCertificationModalOpen(true);
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold flex items-center justify-center text-sm sm:text-base"
                >
                  <Award className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                Add Certification
                </button>
              </div>

              {(!profile || !profile.certifications || !Array.isArray(profile.certifications) || profile.certifications.length === 0) ? (
                <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg sm:rounded-xl">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Award className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm sm:text-lg mb-1 sm:mb-2">No certifications added yet</p>
                  <p className="text-gray-400 text-xs sm:text-sm px-4">Add your professional certifications to enhance your profile</p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                  {profile.certifications?.map((cert, index) => (
                    <div
                      key={cert.id}
                      className={`${index !== 0 ? 'border-t border-gray-200 pt-4 sm:pt-6 lg:pt-8' : ''}`}
                    >
                      <div className="flex items-start">
                        <div className="hidden sm:flex w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-emerald-100 to-green-100 rounded-xl lg:rounded-2xl items-center justify-center mr-4 lg:mr-6 flex-shrink-0 shadow-lg">
                          <Award className="h-6 w-6 lg:h-8 lg:w-8 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-0.5 sm:mb-1">
                                {cert.name}
                              </h3>
                              <p className="text-sm sm:text-base lg:text-lg text-gray-600 font-medium mb-2 sm:mb-3">{cert.issuer}</p>
                              <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                                <div className="flex items-center">
                                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                  <span className="font-medium">Issued: {formatDate(cert.issue_date)}</span>
                                </div>
                                {cert.expiry_date && (
                                  <>
                                    <span className="text-gray-300 hidden sm:inline">•</span>
                                    <span className="font-medium text-orange-600">Expires: {formatDate(cert.expiry_date)}</span>
                                  </>
                                )}
                              </div>
                              {cert.credential_id && (
                                <div className="text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
                                  <span className="font-medium">ID: {cert.credential_id}</span>
                                </div>
                              )}
                              {cert.credential_url && (
                                <a
                                  href={cert.credential_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium text-xs sm:text-sm mb-2 sm:mb-3 bg-emerald-50 px-2 sm:px-3 py-1 rounded-md sm:rounded-lg hover:bg-emerald-100 transition-colors"
                                >
                                  <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                View Credential
                                </a>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setEditingCertification(cert);
                                setIsCertificationModalOpen(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                              title="Edit certification"
                            >
                              <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                          </div>
                          {cert.description && (
                            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 mt-2 sm:mt-4">
                              <p className="text-xs sm:text-sm lg:text-base text-gray-700 leading-relaxed">
                                {cert.description}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Achievements Section */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg mb-4 sm:mb-6 lg:mb-8 p-4 sm:p-6 lg:p-8 border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4 sm:mb-6 lg:mb-8">
                <div className="flex items-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg sm:rounded-xl flex items-center justify-center mr-3 sm:mr-4">
                    <Award className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600" />
                  </div>
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Achievements</h2>
                </div>
                <button
                  onClick={() => {
                    setEditingAchievement(null);
                    setIsAchievementModalOpen(true);
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:from-yellow-700 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold flex items-center justify-center text-sm sm:text-base"
                >
                  <Award className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
                Add Achievement
                </button>
              </div>

              {(!profile || !profile.achievements || !Array.isArray(profile.achievements) || profile.achievements.length === 0) ? (
                <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-lg sm:rounded-xl">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <Award className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm sm:text-lg mb-1 sm:mb-2">No achievements added yet</p>
                  <p className="text-gray-400 text-xs sm:text-sm px-4">Add your achievements to showcase your accomplishments</p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                  {profile.achievements?.map((achievement, index) => (
                    <div
                      key={achievement.id}
                      className={`${index !== 0 ? 'border-t border-gray-200 pt-4 sm:pt-6 lg:pt-8' : ''}`}
                    >
                      <div className="flex items-start">
                        <div className="hidden sm:flex w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl lg:rounded-2xl items-center justify-center mr-4 lg:mr-6 flex-shrink-0 shadow-lg">
                          <Award className="h-6 w-6 lg:h-8 lg:w-8 text-yellow-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-0.5 sm:mb-1">
                                {achievement.title}
                              </h3>
                              <p className="text-sm sm:text-base lg:text-lg text-gray-600 font-medium mb-2 sm:mb-3">{achievement.category}</p>
                              <div className="flex items-center text-xs sm:text-sm text-gray-500 mb-2 sm:mb-4">
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                <span className="font-medium">{formatDate(achievement.date)}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setEditingAchievement(achievement);
                                setIsAchievementModalOpen(true);
                              }}
                              className="text-gray-400 hover:text-gray-600 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
                              title="Edit achievement"
                            >
                              <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                            </button>
                          </div>
                          <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 mt-2 sm:mt-4">
                            <p className="text-xs sm:text-sm lg:text-base text-gray-700 leading-relaxed">
                              {achievement.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb">
        <div className="flex items-center justify-around py-2">
          <button
            onClick={() => navigate('/user/dashboard')}
            className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg transition-colors min-w-[60px] text-gray-500"
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 font-medium">Home</span>
          </button>
          
          <button
            onClick={() => navigate('/jobs')}
            className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg text-gray-500 transition-colors min-w-[60px]"
          >
            <Search className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 font-medium">Jobs</span>
          </button>
          
          <button
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg transition-colors min-w-[60px] text-blue-600"
          >
            <User className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 font-medium">Profile</span>
          </button>
          
          <button
            onClick={() => navigate('/messages')}
            className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg text-gray-500 transition-colors min-w-[60px]"
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 font-medium">Messages</span>
          </button>
          
          <button
            onClick={() => navigate('/applied-jobs')}
            className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg text-gray-500 transition-colors min-w-[60px]"
          >
            <Briefcase className="h-5 w-5" />
            <span className="text-[10px] mt-0.5 font-medium">Applied</span>
          </button>
        </div>
      </nav>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveProfile}
        currentProfile={{
          headline: profile?.headline,
          about: profile?.about,
          location: profile?.location,
          phone: profile?.phone,
          profilePicture: profile?.profilePicture,
        }}
        currentUser={{
          name: user.username,
          email: user.email,
        }}
      />

      <SkillsModal
        isOpen={isSkillsModalOpen}
        onClose={() => setIsSkillsModalOpen(false)}
        onSave={refreshProfile}
        currentSkills={profile?.skills || []}
      />

      <ExperienceModal
        isOpen={isExperienceModalOpen}
        onClose={() => {
          setIsExperienceModalOpen(false);
          setEditingExperience(null);
        }}
        onSave={refreshProfile}
        experience={editingExperience ?? undefined}
        isEdit={!!editingExperience}
      />

      <EducationModal
        isOpen={isEducationModalOpen}
        onClose={() => {
          setIsEducationModalOpen(false);
          setEditingEducation(null);
        }}
        onSave={refreshProfile}
        education={editingEducation ?? undefined}
        isEdit={!!editingEducation}
      />

      <CertificationModal
        isOpen={isCertificationModalOpen}
        onClose={() => {
          setIsCertificationModalOpen(false);
          setEditingCertification(null);
        }}
        onSave={editingCertification ? handleUpdateCertification : handleAddCertification}
        onDelete={handleDeleteCertification}
        onRefresh={fetchProfile}
        certification={editingCertification || undefined}
        isEditing={!!editingCertification}
      />

      <AchievementModal
        isOpen={isAchievementModalOpen}
        onClose={() => {
          setIsAchievementModalOpen(false);
          setEditingAchievement(null);
        }}
        onSave={editingAchievement ? handleUpdateAchievement : handleAddAchievement}
        onDelete={handleDeleteAchievement}
        onRefresh={fetchProfile}
        achievement={editingAchievement || undefined}
        isEditing={!!editingAchievement}
      />

      <VerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        userEmail={user?.email || ''}
        onVerificationSuccess={() => {
          fetchProfile(); // Refresh profile to update verification status
        }}
      />
      
    </>
  );
};

export default UserProfile;
export default UserProfile;