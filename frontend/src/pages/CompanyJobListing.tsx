import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Briefcase, 
  Edit, 
  Trash2, 
  MapPin,
  DollarSign,
  Calendar,
  Building2,
  Eye,
  FileText,
  Home,
  MessageSquare,
  User,
  CreditCard,
  Settings,
  Calendar as CalendarIcon,
  Search,
  X,
  Plus,
} from 'lucide-react';
import { CompanyHeader } from '@/components/CompanyHeader';
import { useTotalUnreadCount } from '@/hooks/useChat';
import { useAuth } from '@/context/AuthContext';
import EditJobModal from '@/components/EditJobModal';
import EditCompanyProfileModal from '@/components/EditCompanyProfileModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import api from '@/api/axios';
import toast from 'react-hot-toast';
import { jobService } from '@/api/jobService';
import { MESSAGES } from '@/constants/messages';
import { Pagination } from '@/components/ui/Pagination';

interface Job {
  id: string;
  title: string;
  description?: string;
  company: string;
  location: string;
  salary?: number;
  jobType?: string;
  requirements: string[];
  benefits: string[];
  experienceLevel?: string;
  education?: string;
  workLocation?: string;
  applicationDeadline?: string;
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;
  isListed?: boolean;
  listedAt?: string;
  status?: string;
}

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

const CompanyJobListing = () => {
  const navigate = useNavigate();
  const { company: authCompany } = useAuth();
  const [company, setCompany] = useState<Company & { logo?: string } | null>(null);

  // Get total unread message count
  const { data: totalUnreadMessages = 0 } = useTotalUnreadCount(
    authCompany?.id || null,
  );
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [togglingJobId, setTogglingJobId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;
  const [searchQuery, setSearchQuery] = useState('');
  const filteredJobs = useMemo(() => {
    if (!searchQuery.trim()) return jobs;
    
    const query = searchQuery.toLowerCase().trim();
    
    return jobs.filter(job => {
      if (job.title.toLowerCase().includes(query)) {
        return true;
      }
      if (
        job.location.toLowerCase().includes(query) ||
        (job.jobType && job.jobType.toLowerCase().includes(query)) ||
        (job.experienceLevel && job.experienceLevel.toLowerCase().includes(query)) ||
        (job.education && job.education.toLowerCase().includes(query)) ||
        (job.workLocation && job.workLocation.toLowerCase().includes(query))
      ) {
        return true;
      }

      if (job.description && job.description.toLowerCase().includes(query)) {
        const words = query.split(' ').filter(word => word.length > 2);
        if (words.length >= 3) {
          return true;
        }
      }
      
      return false;
    });
  }, [jobs, searchQuery]);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      interface CompanyResponse {
        success?: boolean;
        data?: {
          company?: Company;
        };
        company?: Company;
      }
      
      const companyResponse = await api.get<CompanyResponse>('/company/profile');
      let companyData: Company | null = null;
      let companyId = '';
      
      if (companyResponse.data?.success && companyResponse.data.data?.company) {
        companyData = companyResponse.data.data.company;
        companyId = companyData?.id || ''; 
      } else if (companyResponse.data?.company) {
        companyData = companyResponse.data.company;
        companyId = companyData?.id || '';
      }
      
      setCompany(companyData);
      
      if (!companyId || !companyData) {
        setJobs([]);
        return;
      }
 
      interface JobsResponse {
        success?: boolean;
        data?: {
          jobs?: Job[];
        };
      }
      
      const jobsResponse = await api.get<JobsResponse>(`/jobs/company/${companyId}`);
      const jobsList = jobsResponse.data?.data?.jobs ?? [];
      setJobs(Array.isArray(jobsList) ? jobsList : []);
    } catch (error) {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditJob = (job: Job) => {
    setSelectedJob(job);
    setIsEditModalOpen(true);
  };

  const handleDeleteJob = (job: Job) => {
    setJobToDelete(job);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteJob = async () => {
    if (!jobToDelete) return;

    try {
      setIsDeleting(true);
      await api.delete(`/jobs/${jobToDelete.id}`);
      await fetchJobs();
      setIsDeleteModalOpen(false);
      setJobToDelete(null);
    } catch (error) {
      // Silently handle error
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
  };

  const handleToggleListing = async (job: Job) => {
    if (!job.id) return;

    try {
      setTogglingJobId(job.id);
      const newListedStatus = !job.isListed;
      const response = await jobService.toggleJobListing(job.id, newListedStatus);
      
      // Update the job in the local state
      setJobs(prevJobs => 
        prevJobs.map(j => 
          j.id === job.id 
            ? { ...j, isListed: response.data.job.isListed, listedAt: response.data.job.listedAt }
            : j,
        ),
      );
      
      toast.success(
        newListedStatus 
          ? MESSAGES.SUCCESS.JOB_LISTED 
          : MESSAGES.SUCCESS.JOB_UNLISTED,
      );
    } catch (error: unknown) {
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
        : MESSAGES.ERROR.JOB_TOGGLE_FAILED;
      toast.error(errorMessage || MESSAGES.ERROR.JOB_TOGGLE_FAILED);
    } finally {
      setTogglingJobId(null);
    }
  };

  const handleCompanyProfileClick = () => {
    navigate(ROUTES.COMPANY_DASHBOARD);
  };


  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const pagedJobs = filteredJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const goToPage = (p: number) => setCurrentPage(Math.min(Math.max(1, p), totalPages));
  const activeJobsCount = jobs.filter(job => job.isActive !== false && job.status !== 'deleted').length;
  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <CompanyHeader company={company} />

      <div className="flex min-h-screen relative">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm border-r border-gray-200 fixed top-[68px] left-0 bottom-0 overflow-y-auto hide-scrollbar transition-all duration-300 z-10">
          <nav className="p-6">
            <div className="space-y-1 mb-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Main</h3>
              <button 
                onClick={() => navigate(ROUTES.COMPANY_DASHBOARD)}
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
              >
                <Home className="h-5 w-5" />
                Dashboard
              </button>
              <button 
                onClick={() => navigate(ROUTES.CHAT)}
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left relative"
              >
                <MessageSquare className="h-5 w-5" />
                <span className="flex-1">Messages</span>
                {totalUnreadMessages > 0 && (
                  <span className="bg-red-500 text-white text-xs font-semibold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
                  </span>
                )}
              </button>
              <button onClick={() => navigate('/company/dashboard')} className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
                <Building2 className="h-5 w-5" />
                Company Profile
              </button>
              <button onClick={() => navigate(ROUTES.COMPANY_APPLICATIONS)} className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
                <User className="h-5 w-5" />
                All Applicants
              </button>
              <button onClick={() => navigate(ROUTES.COMPANY_JOBS)} className="flex items-center gap-3 px-3 py-2 bg-purple-50 text-purple-700 font-medium rounded-lg w-full text-left">
                <Briefcase className="h-5 w-5" />
                Job Listing
              </button>
              <button 
                onClick={() => navigate(ROUTES.COMPANY_INTERVIEWS)}
                className="flex items-start gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
              >
                <CalendarIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span className="flex flex-col leading-tight">
                  <span>Interview</span>
                  <span>Management</span>
                </span>
              </button>
              <button 
                onClick={() => navigate(ROUTES.COMPANY_OFFERS)}
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
              >
                <FileText className="h-5 w-5" />
                Offer Letters
              </button>
              <button 
                onClick={() => navigate(ROUTES.SUBSCRIPTIONS)}
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
              >
                <CreditCard className="h-5 w-5" />
                Plans & Billing
              </button>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Setting</h3>
              <button onClick={() => navigate(ROUTES.COMPANY_SETTINGS)} className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
                <Settings className="h-5 w-5" />
                Settings
              </button>
            </div>
            
            {/* Company Info */}
            <div className="mt-8">
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100 hover:shadow-md transition-all duration-300">
                {company?.logo ? (
                  <img 
                    src={company.logo} 
                    alt={company.companyName || 'Company logo'} 
                    className="w-8 h-8 rounded-full object-cover border-2 border-purple-200 shadow-sm"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-sm">
                    <Building2 className="h-4 w-4 text-white" />
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium text-gray-900">{company?.companyName || 'Company'}</div>
                  <div className="text-xs text-purple-600">{company?.email || 'email@company.com'}</div>
                </div>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 pt-[84px] ml-64">
          <div className="max-w-7xl mx-auto">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                      <p className="text-3xl font-bold text-gray-900">{jobs.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Briefcase className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                      <p className="text-3xl font-bold text-green-600">{activeJobsCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Eye className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Inactive Jobs</p>
                      <p className="text-3xl font-bold text-red-600">{jobs.length - activeJobsCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">This Month</p>
                      <p className="text-3xl font-bold text-purple-600">
                        {jobs.filter(job => {
                          const jobDate = new Date(job.createdAt);
                          const now = new Date();
                          return jobDate.getMonth() === now.getMonth() && 
                               jobDate.getFullYear() === now.getFullYear();
                        }).length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Jobs List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                Your Job Listings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Search Bar */}
                {jobs.length > 0 && (
                  <div className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Search your jobs by title, location, type, or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          aria-label="Clear search"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {searchQuery && (
                      <div className="mt-2 text-sm text-gray-600">
                      Found {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} matching "{searchQuery}"
                      </div>
                    )}
                  </div>
                )}
                {loading ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <h3 className="text-lg font-semibold text-gray-700">Loading jobs...</h3>
                    <p className="text-gray-500">Please wait while we fetch your job listings</p>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs posted yet</h3>
                    <p className="text-gray-600 mb-6">Create your first job posting to start attracting candidates.</p>
                    <Button 
                      onClick={() => navigate(ROUTES.COMPANY_POST_JOB)} 
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                    Post Your First Job
                    </Button>
                  </div>
                ) : filteredJobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                    <p className="text-gray-600 mb-6">No jobs match your search criteria. Try adjusting your search terms.</p>
                    <Button 
                      onClick={() => setSearchQuery('')} 
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                    Clear Search
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pagedJobs.map((job) => (
                      <div key={job.id} className="border border-gray-200 rounded-lg p-6 hover:border-purple-300 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                job.isActive === false || job.status === 'deleted' 
                                  ? 'bg-red-100 text-red-700' 
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {job.isActive === false || job.status === 'deleted' ? 'Inactive' : 'Active'}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                job.isListed === false
                                  ? 'bg-gray-100 text-gray-700' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {job.isListed === false ? 'Unlisted' : 'Listed'}
                              </span>
                            </div>
                          
                            <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                              <div className="flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                {job.company}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {job.location}
                              </div>
                              <div className="flex items-center gap-1">
                                <Briefcase className="h-4 w-4" />
                                {job.jobType || 'Full-time'}
                              </div>
                              {job.salary && (
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4" />
                                ₹{job.salary.toLocaleString()}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3">
                              <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700">
                                {job.experienceLevel || 'Experience Level'}
                              </span>
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                                {job.education || 'Education'}
                              </span>
                              <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
                                {job.workLocation || 'Work Location'}
                              </span>
                            </div>
                          </div>
                        </div>
                      
                        {job.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                            {job.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-1">
                            <p className="text-sm text-gray-500">
                              Posted {new Date(job.createdAt).toLocaleDateString()}
                            </p>
                            {job.listedAt && (
                              <p className="text-xs text-gray-400">
                                {job.isListed ? 'Listed' : 'Unlisted'} {new Date(job.listedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleToggleListing(job)}
                              disabled={togglingJobId === job.id || job.isActive === false || job.status === 'deleted'}
                              className={job.isListed ? 'text-orange-600 border-orange-200 hover:bg-orange-50' : 'text-blue-600 border-blue-200 hover:bg-blue-50'}
                            >
                              {togglingJobId === job.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1"></div>
                                  {job.isListed ? 'Unlisting...' : 'Listing...'}
                                </>
                              ) : (
                                <>
                                  {job.isListed ? 'Unlist' : 'List'}
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditJob(job)}
                              disabled={job.isActive === false || job.status === 'deleted'}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                            Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteJob(job)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Pagination */}
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={jobs.length}
                      pageSize={pageSize}
                      onPageChange={goToPage}
                      itemName="jobs"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Modals */}
      <EditJobModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        job={selectedJob ? {
          id: selectedJob.id,
          title: selectedJob.title,
          description: selectedJob.description,
          company: selectedJob.company,
          location: selectedJob.location,
          salary: selectedJob.salary,
          jobType: selectedJob.jobType || 'Full-time',
          requirements: selectedJob.requirements,
          benefits: selectedJob.benefits,
          experienceLevel: selectedJob.experienceLevel || 'Not specified',
          education: selectedJob.education || 'Not specified',
          applicationDeadline: selectedJob.applicationDeadline || new Date().toISOString(),
          workLocation: selectedJob.workLocation || 'Not specified',
        } : null}
        onJobUpdated={handleJobUpdated}
      />

      <EditCompanyProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        company={company}
        onProfileUpdated={() => {
          setIsEditProfileModalOpen(false);
          fetchJobs(); 
        }}
      />

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
    </div>
  );
};

export default CompanyJobListing;
