import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import api from '../api/axios';
import Header from '@/components/Header';
import EditProfileModal from '../components/EditProfileModal';
import SkillsModal from '../components/SkillsModal';
import ExperienceModal from '../components/ExperienceModal';
import EducationModal from '../components/EducationModal';
import ResumeUpload from '../components/ResumeUpload';
import { userService } from '../api/userService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CertificationModal from '@/components/CertificationModal';
import AchievementModal from '@/components/AchievementModal';
import AppliedJobs from '@/components/AppliedJobs';
import VerificationModal from '@/components/VerificationModal';

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
  profile: UserProfile;
  user: UserData;
  completionPercentage: number;
}

const UserProfile = () => {
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [isExperienceModalOpen, setIsExperienceModalOpen] = useState(false);
  const [editingExperience, setEditingExperience] = useState<any>(null);
  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState<any>(null);
  const [isCertificationModalOpen, setIsCertificationModalOpen] = useState(false);
  const [editingCertification, setEditingCertification] = useState<Certification | null>(null);
  const [isAchievementModalOpen, setIsAchievementModalOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [isResumeUploading, setIsResumeUploading] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'applied-jobs'>('profile');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get<ProfileResponse>('/profile/full');
      console.log('Profile data received:', response.data);
      console.log('Achievements in profile:', response.data.profile.achievements);
      console.log('Certifications in profile:', response.data.profile.certifications);
      if (response.data.profile.achievements && typeof response.data.profile.achievements === 'string') {
        try {
          response.data.profile.achievements = JSON.parse(response.data.profile.achievements);
          console.log('Parsed achievements:', response.data.profile.achievements);
        } catch (parseError) {
          console.error('Error parsing achievements:', parseError);
          response.data.profile.achievements = [];
        }
      }
      if (response.data.profile.certifications && typeof response.data.profile.certifications === 'string') {
        try {
          response.data.profile.certifications = JSON.parse(response.data.profile.certifications);
          console.log('Parsed certifications:', response.data.profile.certifications);
        } catch (parseError) {
          console.error('Error parsing certifications:', parseError);
          response.data.profile.certifications = [];
        }
      }
      
      setProfileData(response.data);
      console.log('🔍 Frontend - Profile data received:', response.data);
      console.log('🔍 Frontend - User data:', response.data.user);
      console.log('🔍 Frontend - User isVerified:', response.data.user?.isVerified);
    } catch (error) {
      console.error('Error fetching profile:', error);
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
      console.error('Resume upload error:', error);
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
      console.error('Resume delete error:', error);
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

  const handleSaveProfile = async (profileData: Record<string, any>) => {
    try {
      // Always send as JSON now - no more multipart/form-data
      const response = await api.put('/profile/', profileData, {
        headers: { 'Content-Type': 'application/json' }
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
    } catch (error: any) {
      console.error('Profile update error:', error);
      throw new Error(error.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleAddCertification = async (certification: Omit<Certification, 'id'>) => {
    try {
      const response = await api.post('/profile/certifications', certification);
      if ((response.data as { success: boolean }).success) {
        toast.success('Certification added successfully!');
        await fetchProfile();
      }
    } catch (error: any) {
      console.error('Error adding certification:', error);
      console.error('Error response data:', error.response?.data);
      
      // Extract error message from different possible locations
      let errorMessage = 'Failed to add certification';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  };

  const handleDeleteCertification = async (certificationId: string) => {
    try {
      const response = await api.delete(`/profile/certifications/${certificationId}`);
      if ((response.data as { success: boolean }).success) {
        toast.success('Certification deleted successfully!');
        await fetchProfile();
      }
    } catch (error: any) {
      console.error('Error deleting certification:', error);
      console.error('Error response data:', error.response?.data);
      
      // Extract error message from different possible locations
      let errorMessage = 'Failed to delete certification';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  };

  const handleUpdateCertification = async (certification: Omit<Certification, 'id'>) => {
    if (!editingCertification) return;
    
    try {
      console.log('🔍 [CERTIFICATION-UPDATE] Sending data:', certification);
      const response = await api.put(`/profile/certifications/${editingCertification.id}`, certification);
      if ((response.data as { success: boolean }).success) {
        toast.success('Certification updated successfully!');
        await fetchProfile();
      }
    } catch (error: any) {
      console.error('Error updating certification:', error);
      console.error('Error response data:', error.response?.data);
      
      // Extract error message from different possible locations
      let errorMessage = 'Failed to update certification';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  };

  const handleAddAchievement = async (achievement: Omit<Achievement, 'id'>) => {
    try {
      const response = await api.post('/profile/achievements', achievement);
      if ((response.data as { success: boolean }).success) {
        toast.success('Achievement added successfully!');
        await fetchProfile();
      }
    } catch (error: any) {
      console.error('Error adding achievement:', error);
      console.error('Error response data:', error.response?.data);
      
      // Extract error message from different possible locations
      let errorMessage = 'Failed to add achievement';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  };

  const handleDeleteAchievement = async (achievementId: string) => {
    try {
      const response = await api.delete(`/profile/achievements/${achievementId}`);
      if ((response.data as { success: boolean }).success) {
        toast.success('Achievement deleted successfully!');
        await fetchProfile();
      }
    } catch (error: any) {
      console.error('Error deleting achievement:', error);
      console.error('Error response data:', error.response?.data);
      
      // Extract error message from different possible locations
      let errorMessage = 'Failed to delete achievement';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  };

  const handleUpdateAchievement = async (achievement: Omit<Achievement, 'id'>) => {
    if (!editingAchievement) return;
    
    try {
      console.log('🔍 [ACHIEVEMENT-UPDATE] Sending data:', achievement);
      const response = await api.put(`/profile/achievements/${editingAchievement.id}`, achievement);
      if ((response.data as { success: boolean }).success) {
        toast.success('Achievement updated successfully!');
        await fetchProfile();
      }
    } catch (error: any) {
      console.error('Error updating achievement:', error);
      console.error('Error response data:', error.response?.data);
      
      // Extract error message from different possible locations
      let errorMessage = 'Failed to update achievement';
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  };


  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto py-8 px-4">
          {/* Profile Header Card */}
          <div className="bg-white rounded-2xl shadow-xl mb-8 overflow-hidden border border-gray-100">
            {/* Cover Photo */}
            <div className="h-48 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
              <div className="absolute inset-0 bg-black/10"></div>
            </div>

            <div className="px-8 pb-8">
              <div className="flex items-start -mt-20 mb-6">
                {/* Profile Picture */}
                <div className="relative">
                  <div className="w-40 h-40 bg-white rounded-2xl border-4 border-white shadow-xl flex items-center justify-center">
                    {profile.profilePicture ? (
                      <img
                        src={profile.profilePicture}
                        alt={user.username}
                        className="w-full h-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <User className="h-20 w-20 text-white" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Completion Card */}
                <div className="ml-auto mt-16">
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200 shadow-lg">
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-3">
                        <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                          <span className="text-white font-bold text-xl">{completionPercentage}%</span>
                        </div>
                        <div className="text-left">
                          <div className="text-lg font-bold text-gray-800">
                            Profile Complete
                          </div>
                          <div className="text-sm text-gray-600">
                            {completionPercentage === 100 ? '🎉 Perfect!' : 'Keep going!'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-4 mb-3 shadow-inner">
                        <div
                          className={`h-4 rounded-full transition-all duration-700 ease-out shadow-sm ${
                            completionPercentage === 100 
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                              : completionPercentage >= 70 
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                              : completionPercentage >= 40
                              ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                              : 'bg-gradient-to-r from-red-500 to-pink-500'
                          }`}
                          style={{ width: `${completionPercentage}%` }}
                        ></div>
                      </div>
                      
                      <div className="text-sm font-medium text-gray-600">
                        {completionPercentage === 100 
                          ? '🎉 Your profile is complete!' 
                          : `${100 - completionPercentage}% remaining to complete`
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {user.username}
                </h1>
                <p className="text-xl text-gray-600 mb-4 font-medium">
                  {profile.headline || 'Add a professional headline'}
                </p>

                <div className="flex flex-wrap items-center gap-6 text-gray-600">
                  {profile.location && (
                    <div className="flex items-center bg-gray-50 px-4 py-2 rounded-xl">
                      <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                      <span className="font-medium">{profile.location}</span>
                    </div>
                  )}
                  <div className="flex items-center bg-gray-50 px-4 py-2 rounded-xl">
                    <Mail className="h-5 w-5 mr-2 text-blue-600" />
                    <span className="font-medium">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-xl">
                    <div className="flex items-center">
                      {user.isVerified ? (
                        <>
                          <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                          <span className="font-medium text-green-600">Email Verified</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
                          <span className="font-medium text-orange-600">Email Not Verified</span>
                        </>
                      )}
                    </div>
                    {!user.isVerified && (
                      <button
                        onClick={() => setIsVerificationModalOpen(true)}
                        className="text-sm bg-orange-600 text-white px-3 py-1 rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        Verify Now
                      </button>
                    )}
                  </div>
                  {profile.phone && (
                    <div className="flex items-center bg-gray-50 px-4 py-2 rounded-xl">
                      <Phone className="h-5 w-5 mr-2 text-blue-600" />
                      <span className="font-medium">{profile.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                {/* Tab Buttons */}
                <div className="flex bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === 'profile'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => setActiveTab('applied-jobs')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === 'applied-jobs'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Applied Jobs
                  </button>
                </div>
                
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold flex items-center"
                >
                  <Edit className="h-5 w-5 mr-2" />
                  Edit Profile
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'profile' && (
            <>
              {/* About Section */}
          <div className="bg-white rounded-2xl shadow-lg mb-8 p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mr-4">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">About</h2>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-6">
              <p className="text-gray-700 leading-relaxed text-lg">
                {profile.about ||
                  'Add a summary to highlight your personality or work experience'}
              </p>
            </div>
          </div>

          {/* Resume Section */}
          <div className="bg-white rounded-2xl shadow-lg mb-8 p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl flex items-center justify-center mr-4">
                  <Briefcase className="h-6 w-6 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Resume</h2>
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
          <div className="bg-white rounded-2xl shadow-lg mb-8 p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mr-4">
                  <Briefcase className="h-6 w-6 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Experience</h2>
              </div>
              <button
                onClick={() => {
                  setEditingExperience(null);
                  setIsExperienceModalOpen(true);
                }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold flex items-center"
              >
                <Briefcase className="h-5 w-5 mr-2" />
                Add Experience
              </button>
            </div>

            {profile.experience.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg mb-2">No experience added yet</p>
                <p className="text-gray-400 text-sm">Add your work experience to showcase your professional journey</p>
              </div>
            ) : (
              <div className="space-y-8">
                {profile.experience.map((exp, index) => (
                  <div
                    key={exp.id}
                    className={`${index !== 0 ? 'border-t border-gray-200 pt-8' : ''}`}
                  >
                    <div className="flex items-start">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0 shadow-lg">
                        <Briefcase className="h-8 w-8 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                              {exp.title}
                            </h3>
                            <p className="text-lg text-gray-600 font-medium mb-2">{exp.company}</p>
                            {exp.location && (
                              <div className="flex items-center text-gray-500 mb-3">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span className="text-sm">{exp.location}</span>
                              </div>
                            )}
                            <div className="flex items-center text-sm text-gray-500 mb-4">
                              <Calendar className="h-4 w-4 mr-2" />
                              <span className="font-medium">
                                {formatDate(exp.startDate)} -{' '}
                                {exp.isCurrentRole
                                  ? 'Present'
                                  : exp.endDate
                                    ? formatDate(exp.endDate)
                                    : 'Present'}
                              </span>
                              <span className="mx-3 text-gray-300">•</span>
                              <span className="font-medium">
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
                            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                        </div>
                        {exp.description && (
                          <div className="bg-gray-50 rounded-xl p-4 mt-4">
                            <p className="text-gray-700 leading-relaxed">
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
          <div className="bg-white rounded-2xl shadow-lg mb-8 p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-100 to-blue-100 rounded-xl flex items-center justify-center mr-4">
                  <GraduationCap className="h-6 w-6 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Education</h2>
              </div>
              <button
                onClick={() => {
                  setEditingEducation(null);
                  setIsEducationModalOpen(true);
                }}
                className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold flex items-center"
              >
                <GraduationCap className="h-5 w-5 mr-2" />
                Add Education
              </button>
            </div>

            {profile.education.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg mb-2">No education added yet</p>
                <p className="text-gray-400 text-sm">Add your educational background to showcase your qualifications</p>
              </div>
            ) : (
              <div className="space-y-8">
                {profile.education.map((edu, index) => (
                  <div
                    key={edu.id}
                    className={`${index !== 0 ? 'border-t border-gray-200 pt-8' : ''}`}
                  >
                    <div className="flex items-start">
                      <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-blue-100 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0 shadow-lg">
                        <GraduationCap className="h-8 w-8 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                              {edu.institution}
                            </h3>
                            <p className="text-lg text-gray-600 font-medium mb-3">{edu.degree}</p>
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="h-4 w-4 mr-2" />
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
                            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <Edit className="h-5 w-5" />
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
          <div className="bg-white rounded-2xl shadow-lg mb-8 p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-100 to-red-100 rounded-xl flex items-center justify-center mr-4">
                  <Award className="h-6 w-6 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Skills</h2>
              </div>
              <button
                onClick={() => setIsSkillsModalOpen(true)}
                className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-3 rounded-xl hover:from-orange-700 hover:to-red-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold flex items-center"
              >
                <Award className="h-5 w-5 mr-2" />
                Add Skills
              </button>
            </div>

            {profile.skills.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg mb-2">No skills added yet</p>
                <p className="text-gray-400 text-sm">Add your skills to showcase your expertise</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {profile.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 px-4 py-2 rounded-xl text-sm font-semibold border border-orange-200 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Certifications Section */}
          <div className="bg-white rounded-2xl shadow-lg mb-8 p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-100 to-green-100 rounded-xl flex items-center justify-center mr-4">
                  <Award className="h-6 w-6 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Certifications</h2>
              </div>
              <button
                onClick={() => {
                  setEditingCertification(null);
                  setIsCertificationModalOpen(true);
                }}
                className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3 rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold flex items-center"
              >
                <Award className="h-5 w-5 mr-2" />
                Add Certification
              </button>
            </div>

            {(!profile || !profile.certifications || !Array.isArray(profile.certifications) || profile.certifications.length === 0) ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg mb-2">No certifications added yet</p>
                <p className="text-gray-400 text-sm">Add your professional certifications to enhance your profile</p>
              </div>
            ) : (
              <div className="space-y-8">
                {profile.certifications.map((cert, index) => (
                  <div
                    key={cert.id}
                    className={`${index !== 0 ? 'border-t border-gray-200 pt-8' : ''}`}
                  >
                    <div className="flex items-start">
                      <div className="w-16 h-16 bg-gradient-to-r from-emerald-100 to-green-100 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0 shadow-lg">
                        <Award className="h-8 w-8 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                              {cert.name}
                            </h3>
                            <p className="text-lg text-gray-600 font-medium mb-3">{cert.issuer}</p>
                            <div className="flex items-center text-sm text-gray-500 mb-3">
                              <Calendar className="h-4 w-4 mr-2" />
                              <span className="font-medium">Issued: {formatDate(cert.issue_date)}</span>
                              {cert.expiry_date && (
                                <>
                                  <span className="mx-3 text-gray-300">•</span>
                                  <span className="font-medium">Expires: {formatDate(cert.expiry_date)}</span>
                                </>
                              )}
                            </div>
                            {cert.credential_id && (
                              <div className="flex items-center text-sm text-gray-500 mb-3">
                                <span className="font-medium">ID: {cert.credential_id}</span>
                              </div>
                            )}
                            {cert.credential_url && (
                              <a
                                href={cert.credential_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium text-sm mb-3 bg-emerald-50 px-3 py-1 rounded-lg hover:bg-emerald-100 transition-colors"
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View Credential
                              </a>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setEditingCertification(cert);
                              setIsCertificationModalOpen(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Edit certification"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                        </div>
                        {cert.description && (
                          <div className="bg-gray-50 rounded-xl p-4 mt-4">
                            <p className="text-gray-700 leading-relaxed">
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
          <div className="bg-white rounded-2xl shadow-lg mb-8 p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl flex items-center justify-center mr-4">
                  <Award className="h-6 w-6 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Achievements</h2>
              </div>
              <button
                onClick={() => {
                  setEditingAchievement(null);
                  setIsAchievementModalOpen(true);
                }}
                className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white px-6 py-3 rounded-xl hover:from-yellow-700 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold flex items-center"
              >
                <Award className="h-5 w-5 mr-2" />
                Add Achievement
              </button>
            </div>

            {(!profile || !profile.achievements || !Array.isArray(profile.achievements) || profile.achievements.length === 0) ? (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg mb-2">No achievements added yet</p>
                <p className="text-gray-400 text-sm">Add your achievements to showcase your accomplishments</p>
              </div>
            ) : (
              <div className="space-y-8">
                {profile.achievements.map((achievement, index) => (
                  <div
                    key={achievement.id}
                    className={`${index !== 0 ? 'border-t border-gray-200 pt-8' : ''}`}
                  >
                    <div className="flex items-start">
                      <div className="w-16 h-16 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-2xl flex items-center justify-center mr-6 flex-shrink-0 shadow-lg">
                        <Award className="h-8 w-8 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                              {achievement.title}
                            </h3>
                            <p className="text-lg text-gray-600 font-medium mb-3">{achievement.category}</p>
                            <div className="flex items-center text-sm text-gray-500 mb-4">
                              <Calendar className="h-4 w-4 mr-2" />
                              <span className="font-medium">{formatDate(achievement.date)}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setEditingAchievement(achievement);
                              setIsAchievementModalOpen(true);
                            }}
                            className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Edit achievement"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 mt-4">
                          <p className="text-gray-700 leading-relaxed">
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
          )}

          {/* Applied Jobs Tab Content */}
          {activeTab === 'applied-jobs' && (
            <AppliedJobs userId={profile.id} />
          )}
        </div>
      </div>

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
        experience={editingExperience}
        isEdit={!!editingExperience}
      />

      <EducationModal
        isOpen={isEducationModalOpen}
        onClose={() => {
          setIsEducationModalOpen(false);
          setEditingEducation(null);
        }}
        onSave={refreshProfile}
        education={editingEducation}
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
      
      <ToastContainer />
    </>
  );
};

export default UserProfile;