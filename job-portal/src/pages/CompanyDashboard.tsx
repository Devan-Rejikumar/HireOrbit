import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, Briefcase, Plus, LogOut, UserCheck, MapPin, Edit, Trash2, ChevronLeft, ChevronRight, TrendingUp, Calendar, CheckCircle, AlertCircle, Settings, BarChart3, Eye, FileText, Star, Mail } from 'lucide-react';
import api from '@/api/axios';
import EditJobModal from '@/components/EditJobModal';
import EditCompanyProfileModal from '@/components/EditCompanyProfileModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import CompanyDetailsModal from '@/components/CompanyDetailsModal';

interface Company {
  id: string;
  companyName: string;
  email: string;
  industry?: string;
  size?: string;
  isVerified: boolean;
  profileCompleted?: boolean;
  jobCount?: number;
  rejectionReason?: string;
}

interface ProfileStep {
  profileCompleted: boolean;
  currentStep: number;
}

interface CompanyProfileResponse {
  company: Company;
  profileStep?: ProfileStep | null;
}

const CompanyDashboard = () => {
  const { logout, isAuthenticated, role } = useAuth();
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileStep, setProfileStep] = useState<ProfileStep | null>(null);
  const [jobCount, setJobCount] = useState<number>(0);

  // Minimal local type for jobs shown in dashboard
  type DashboardJob = {
    id: string;
    title: string;
    description?: string;
    company: string;
    location: string;
    salary?: number;
    jobType: string;
    requirements: string[];
    benefits: string[];
    experienceLevel: string;
    education: string;
    applicationDeadline: string;
    workLocation: string;
    createdAt: string;
    isActive?: boolean;
    status?: 'active' | 'inactive' | 'deleted';
  };
  const [jobs, setJobs] = useState<DashboardJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<DashboardJob | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [showPostedJobs, setShowPostedJobs] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<DashboardJob | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAllCompanyInfo, setShowAllCompanyInfo] = useState(false);
  const [isCompanyDetailsOpen, setIsCompanyDetailsOpen] = useState(false);

  useEffect(() => {
    fetchCompanyProfile();
    fetchJobCount();
  }, []);

  useEffect(() => {
    if (company?.companyName) {
      fetchJobs();
    }
  }, [company?.companyName]);

  const fetchCompanyProfile = async () => {
    try {
      console.log('🚀 CompanyDashboard: Fetching company profile...');
      const response = await api.get<{
        success: boolean;
        data: {
          company: Company;
          profileStep?: ProfileStep | null | undefined;
        };
        company?: Company;
        profileStep?: ProfileStep | null | undefined;
      }>('/company/profile');

      // Check the actual response structure
      if (response.data && response.data.success && response.data.data && response.data.data.company) {
        console.log('✅ CompanyDashboard: Valid response structure found');
        setCompany(response.data.data.company);
        setProfileStep(response.data.data.profileStep || null);
        console.log('🏢 CompanyDashboard: Company data set:', response.data.data.company);
      } else if (response.data && response.data.company) {
        console.log('✅ CompanyDashboard: Direct company structure found');
        setCompany(response.data.company);
        setProfileStep(response.data.profileStep || null);
      } else {
        console.error('❌ CompanyDashboard: Invalid response structure');
        console.error('❌ CompanyDashboard: Expected structure: { success: true, data: { company: {...} } } or { company: {...} }');
        console.error('❌ CompanyDashboard: Actual structure:', response.data);
        setCompany(null);
        setProfileStep(null);
      }
    } catch (error) {
      console.error('❌ CompanyDashboard: Error fetching company profile:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown } };
        console.error('❌ CompanyDashboard: Error response:', axiosError.response);
        console.error('❌ CompanyDashboard: Error data:', axiosError.response?.data);
      }
    } finally {
      setLoading(false);
    }
  };


  const fetchJobCount = async (): Promise<void> => {
    try {
      const response = await api.get<{ success: boolean; data: { count: number } }>('/company/job-count');
      setJobCount(response.data.data.count || 0);
    } catch (error) {
      console.error('Error fetching job count:', error);
      setJobCount(0);
    }
  };

  const fetchJobs = async (): Promise<void> => {
    try {
      if (!company?.companyName) return;
      const res = await api.get<{
        data: { jobs: DashboardJob[] };
      }>(`/jobs/company/${encodeURIComponent(company.companyName)}`);
      const list: DashboardJob[] = res.data?.data?.jobs ?? [];
      setJobs(list);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
    }
  };

  const handleEditJob = (job: DashboardJob): void => {
    setSelectedJob(job);
    setIsEditModalOpen(true);
  };

  const handleDeleteJob = (job: DashboardJob): void => {
    setJobToDelete(job);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteJob = async (): Promise<void> => {
    if (!jobToDelete) return;

    try {
      setIsDeleting(true);
      await api.delete(`/jobs/${jobToDelete.id}`);
      await fetchJobs();
      await fetchJobCount();
      setIsDeleteModalOpen(false);
      setJobToDelete(null);
    } catch (error) {
      console.error('Error deleting job:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteJob = (): void => {
    setIsDeleteModalOpen(false);
    setJobToDelete(null);
  };

  const handleJobUpdated = (): void => {
    fetchJobs();
    fetchJobCount();
  };

  const handleEditProfile = (): void => {
    console.log('Edit profile button clicked!');
    console.log('Current company data:', company);
    setIsEditProfileModalOpen(true);
  };

  const handleProfileUpdated = (): void => {
    fetchCompanyProfile();
    setIsEditProfileModalOpen(false);
  };

  // Pagination helpers
  const totalPages = Math.max(1, Math.ceil(jobs.length / pageSize));
  const pagedJobs = jobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const goToPage = (p: number) => setCurrentPage(Math.min(Math.max(1, p), totalPages));

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const handleCompleteProfile = () => {
    navigate('/company/profile-setup');
  };

  // Check if profile needs completion
  const needsProfileCompletion = !company?.profileCompleted && !company?.isVerified;

  // Calculate active jobs count
  const activeJobsCount = jobs.filter(job => job.isActive !== false && job.status !== 'deleted').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-700">Loading your dashboard...</h3>
          <p className="text-gray-500">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Enhanced Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 mb-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div className="text-white">
                <h1 className="text-4xl font-bold mb-2">
                  Welcome back, {company?.companyName || 'Company'}!
                </h1>
                <p className="text-blue-100 text-lg">
                  Manage your hiring process and grow your team
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm font-medium">{company?.industry || 'Industry'}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-medium">{company?.size || 'Company Size'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setIsEditProfileModalOpen(true)}
                  variant="outline"
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-24 -translate-x-24"></div>
        </div>

        {/* Enhanced Profile Completion Alert */}
        {needsProfileCompletion && (
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 p-6 mb-8 shadow-lg">
            <div className="absolute inset-0 bg-black/5"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">
                    Complete Your Company Profile
                  </h3>
                  <p className="text-amber-100">
                    Your profile needs to be completed and approved before you can post jobs and start hiring.
                  </p>
                </div>
                <Button
                  onClick={handleCompleteProfile}
                  className="bg-white text-amber-600 hover:bg-amber-50 font-semibold px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Complete Profile
                </Button>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          </div>
        )}

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Active Jobs Card */}
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Briefcase className="h-6 w-6" />
                </div>
                <TrendingUp className="h-5 w-5 text-blue-200" />
              </div>
              <div className="text-3xl font-bold mb-1">{activeJobsCount}</div>
              <p className="text-blue-100 text-sm">
                {activeJobsCount === 0 ? 'No active jobs' : `${activeJobsCount} active job${activeJobsCount === 1 ? '' : 's'}`}
              </p>
            </div>
          </div>

          {/* Applications Card */}
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Users className="h-6 w-6" />
                </div>
                <BarChart3 className="h-5 w-5 text-green-200" />
              </div>
              <div className="text-3xl font-bold mb-1">0</div>
              <p className="text-green-100 text-sm">
                No applications yet
              </p>
            </div>
          </div>

          {/* Company Status Card */}
          <div className={`group relative overflow-hidden rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
            company?.isVerified 
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' 
              : 'bg-gradient-to-br from-amber-500 to-amber-600'
          }`}>
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Building2 className="h-6 w-6" />
                </div>
                {company?.isVerified ? (
                  <CheckCircle className="h-5 w-5 text-emerald-200" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-200" />
                )}
              </div>
              <div className="text-3xl font-bold mb-1">
                {company?.isVerified ? 'Approved' : 'Pending'}
              </div>
              <p className={`text-sm ${
                company?.isVerified ? 'text-emerald-100' : 'text-amber-100'
              }`}>
                {company?.isVerified
                  ? 'Ready to post jobs'
                  : 'Awaiting approval'}
              </p>
            </div>
          </div>

          {/* Total Jobs Card */}
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <FileText className="h-6 w-6" />
                </div>
                <Calendar className="h-5 w-5 text-purple-200" />
              </div>
              <div className="text-3xl font-bold mb-1">{jobs.length}</div>
              <p className="text-purple-100 text-sm">
                Total jobs posted
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Company Info Card */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Company Information */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6" />
                <CardTitle className="text-xl font-bold">Company Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {(() => {
                const items = [
                  {
                    key: 'companyName',
                    label: 'Company Name',
                    value: company?.companyName || 'N/A',
                    iconBg: 'bg-blue-100',
                    Icon: Building2,
                    iconColor: 'text-blue-600',
                  },
                  {
                    key: 'industry',
                    label: 'Industry',
                    value: company?.industry || 'N/A',
                    iconBg: 'bg-green-100',
                    Icon: Users,
                    iconColor: 'text-green-600',
                  },
                  {
                    key: 'size',
                    label: 'Company Size',
                    value: company?.size || 'N/A',
                    iconBg: 'bg-purple-100',
                    Icon: BarChart3,
                    iconColor: 'text-purple-600',
                  },
                  {
                    key: 'email',
                    label: 'Email',
                    value: company?.email || 'N/A',
                    iconBg: 'bg-indigo-100',
                    Icon: Mail,
                    iconColor: 'text-indigo-600',
                  },
                ];

                const visible = showAllCompanyInfo ? items : items.slice(0, 3);

                return (
                  <div className="space-y-6">
                    {visible.map((item) => (
                      <div key={item.key} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className={`w-12 h-12 ${item.iconBg} rounded-full flex items-center justify-center`}>
                          <item.Icon className={`h-6 w-6 ${item.iconColor}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">{item.label}</p>
                          <p className="text-lg font-semibold text-gray-900">{item.value}</p>
                        </div>
                      </div>
                    ))}

                    <div className="pt-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setIsCompanyDetailsOpen(true)}
                      >
                        Show more
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg">
              <div className="flex items-center gap-3">
                <Star className="h-6 w-6" />
                <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full justify-start h-12 text-left border-blue-200 text-blue-700 hover:bg-blue-50"
                  disabled={!company?.isVerified}
                  onClick={() => navigate('/company/post-job')}
                >
                  <Plus className="h-5 w-5 mr-3" />
                  <div>
                    <div className="font-semibold">Post New Job</div>
                    <div className="text-xs text-gray-500">Create a new job posting</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-12 text-left border-green-200 text-green-700 hover:bg-green-50"
                  onClick={() => navigate('/company/applications')}
                >
                  <Eye className="h-5 w-5 mr-3" />
                  <div>
                    <div className="font-semibold">View Applications</div>
                    <div className="text-xs text-gray-500">Review candidate applications</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="w-full justify-start h-12 text-left border-purple-200 text-purple-700 hover:bg-purple-50"
                  onClick={() => { setShowPostedJobs((s) => !s); setCurrentPage(1); }}
                >
                  <Briefcase className="h-5 w-5 mr-3" />
                  <div>
                    <div className="font-semibold">{showPostedJobs ? 'Hide Posted Jobs' : 'View Posted Jobs'}</div>
                    <div className="text-xs text-gray-500">Manage your job postings</div>
                  </div>
                </Button>

                {company?.rejectionReason && !company?.isVerified && (
                  <Button
                    variant="outline"
                    className="w-full justify-start h-12 text-left border-amber-200 text-amber-700 hover:bg-amber-50"
                    onClick={() => navigate('/company/review-status')}
                  >
                    <AlertCircle className="h-5 w-5 mr-3" />
                    <div>
                      <div className="font-semibold">Update & Reapply</div>
                      <div className="text-xs text-gray-500">Address feedback and reapply</div>
                    </div>
                  </Button>
                )}

                {needsProfileCompletion ? (
                  <Button
                    variant="outline"
                    className="w-full justify-start h-12 text-left border-orange-200 text-orange-700 hover:bg-orange-50"
                    onClick={handleCompleteProfile}
                  >
                    <UserCheck className="h-5 w-5 mr-3" />
                    <div>
                      <div className="font-semibold">Complete Profile</div>
                      <div className="text-xs text-gray-500">Finish setting up your company</div>
                    </div>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full justify-start h-12 text-left border-gray-200 text-gray-700 hover:bg-gray-50"
                    onClick={() => setIsEditProfileModalOpen(true)}
                  >
                    <Settings className="h-5 w-5 mr-3" />
                    <div>
                      <div className="font-semibold">Edit Profile</div>
                      <div className="text-xs text-gray-500">Update company information</div>
                    </div>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>


        {/* Jobs List */}
        {showPostedJobs && (
          <Card className="mt-8 shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-6 w-6" />
                  <CardTitle className="text-xl font-bold">Your Posted Jobs</CardTitle>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                    {jobs.length} {jobs.length === 1 ? 'Job' : 'Jobs'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-blue-100">Page size</label>
                  <select
                    className="h-9 rounded-md border-0 bg-white/20 text-white placeholder-white/70 px-3 text-sm focus:ring-2 focus:ring-white/30"
                    value={pageSize}
                    onChange={(e) => { setPageSize(parseInt(e.target.value) || 5); setCurrentPage(1); }}
                  >
                    <option value={5} className="text-gray-800">5</option>
                    <option value={10} className="text-gray-800">10</option>
                    <option value={20} className="text-gray-800">20</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {jobs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Briefcase className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No jobs posted yet</h3>
                  <p className="text-gray-500 mb-6">Start building your team by posting your first job opening.</p>
                  <Button 
                    onClick={() => navigate('/company/post-job')}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Post Your First Job
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {pagedJobs.map((job, index) => (
                    <div 
                      key={job.id} 
                      className="group relative bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 overflow-hidden"
                    >
                      {/* Job Status Badge moved to right column to avoid overlap */}

                      <div className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-4">
                            {/* Job Title */}
                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                              {job.title}
                            </h3>
                            
                            {/* Company & Location */}
                            <div className="flex items-center gap-4 mb-3">
                              <div className="flex items-center gap-2 text-gray-600">
                                <Building2 className="h-4 w-4" />
                                <span className="font-medium">{job.company}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <MapPin className="h-4 w-4" />
                                <span>{job.location}</span>
                              </div>
                            </div>

                            {/* Job Type & Salary */}
                            <div className="flex items-center gap-4 mb-3">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                                {job.jobType}
                              </span>
                              {job.salary && (
                                <span className="text-green-600 font-semibold">
                                  ₹{job.salary.toLocaleString()}
                                </span>
                              )}
                            </div>

                            {/* Additional Job Info */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                {job.experienceLevel}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                                {job.education}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                {job.workLocation}
                              </span>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}
                              </span>
                            </div>

                            {/* Job Description Preview */}
                            {job.description && (
                              <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">
                                {job.description.length > 150 
                                  ? `${job.description.substring(0, 150)}...` 
                                  : job.description
                                }
                              </p>
                            )}

                            {/* Requirements Preview */}
                            {job.requirements && job.requirements.length > 0 && (
                              <div className="mb-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Requirements:</h4>
                                <div className="flex flex-wrap gap-2">
                                  {job.requirements.slice(0, 3).map((req, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                                      {req}
                                    </span>
                                  ))}
                                  {job.requirements.length > 3 && (
                                    <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
                                      +{job.requirements.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Created Date */}
                            <div className="text-xs text-gray-500">
                              Posted {new Date(job.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          </div>

                          {/* Right column: status + action buttons */}
                          <div className="flex flex-col gap-2 ml-4 items-end">
                            <div>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                job.isActive === false || job.status === 'deleted'
                                  ? 'bg-red-100 text-red-700 border border-red-200'
                                  : 'bg-green-100 text-green-700 border border-green-200'
                              }`}>
                                <div className={`w-2 h-2 rounded-full mr-2 ${
                                  job.isActive === false || job.status === 'deleted' ? 'bg-red-500' : 'bg-green-500'
                                }`}></div>
                                {(job.isActive === false || job.status === 'deleted') ? 'Inactive' : 'Active'}
                              </span>
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditJob(job)}
                              disabled={job.isActive === false || job.status === 'deleted'}
                              className="w-full bg-white hover:bg-blue-50 border-blue-200 text-blue-600 hover:text-blue-700 hover:border-blue-300 transition-all duration-200"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteJob(job)}
                              className="w-full bg-white hover:bg-red-50 border-red-200 text-red-600 hover:text-red-700 hover:border-red-300 transition-all duration-200"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Hover Effect Border */}
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                    </div>
                  ))}

                  {/* Enhanced Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                      <div className="text-sm text-gray-600">
                        Showing <span className="font-semibold">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                        <span className="font-semibold">{Math.min(currentPage * pageSize, jobs.length)}</span> of{' '}
                        <span className="font-semibold">{jobs.length}</span> jobs
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={currentPage <= 1} 
                          onClick={() => goToPage(1)}
                          className="px-3 py-2"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          First
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={currentPage <= 1} 
                          onClick={() => goToPage(currentPage - 1)}
                          className="px-3 py-2"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Prev
                        </Button>
                        
                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                            if (pageNum > totalPages) return null;
                            
                            return (
                              <Button
                                key={pageNum}
                                variant={pageNum === currentPage ? "default" : "outline"}
                                size="sm"
                                onClick={() => goToPage(pageNum)}
                                className={`px-3 py-2 ${
                                  pageNum === currentPage 
                                    ? 'bg-blue-600 text-white' 
                                    : 'hover:bg-blue-50'
                                }`}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>

                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={currentPage >= totalPages} 
                          onClick={() => goToPage(currentPage + 1)}
                          className="px-3 py-2"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={currentPage >= totalPages} 
                          onClick={() => goToPage(totalPages)}
                          className="px-3 py-2"
                        >
                          Last
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Edit Job Modal */}
        <EditJobModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          job={selectedJob}
          onJobUpdated={handleJobUpdated}
        />

        {/* Edit Company Profile Modal */}
        <EditCompanyProfileModal
          isOpen={isEditProfileModalOpen}
          onClose={() => setIsEditProfileModalOpen(false)}
          company={company}
          onProfileUpdated={handleProfileUpdated}
        />

        {/* Delete Job Confirmation Modal */}
        <ConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={cancelDeleteJob}
          onConfirm={confirmDeleteJob}
          title="Delete Job"
          message={`Are you sure you want to delete "${jobToDelete?.title}"? This action cannot be undone.`}
          confirmText="Delete Job"
          cancelText="Cancel"
          type="danger"
          loading={isDeleting}
        />

        {/* Company Details Modal */}
        <CompanyDetailsModal
          isOpen={isCompanyDetailsOpen}
          onClose={() => setIsCompanyDetailsOpen(false)}
          company={company}
        />
      </div>
    </div>
  );
};

export default CompanyDashboard;
