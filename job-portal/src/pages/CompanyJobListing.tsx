import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Briefcase, 
  Plus, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft,
  MapPin,
  DollarSign,
  Calendar,
  Users,
  Building2,
  Eye,
  FileText,
  Home,
  MessageSquare,
  User,
  GraduationCap,
  Clock,
  CreditCard,
  HelpCircle,
  Bell,
  Settings,
  LogOut,
  Calendar as CalendarIcon,
  Search,
  X
} from 'lucide-react';
import EditJobModal from '@/components/EditJobModal';
import EditCompanyProfileModal from '@/components/EditCompanyProfileModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import api from '@/api/axios';

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
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

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
        console.error('No company ID found');
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
      console.error('Error fetching jobs:', error);
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
  };

  const handleCompanyProfileClick = () => {
    navigate('/company/dashboard');
  };

  const handleLogout = async () => {
    navigate('/login', { replace: true });
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
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Hire Orbit Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Hire Orbit</span>
            </div>
            
            {/* Company Info */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Company</span>
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span className="font-medium">{company?.companyName || 'Company'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Post Job Button */}
            <div className="flex items-center gap-2">
              <Button 
                className={`px-4 py-2 ${
                  company?.profileCompleted && company?.isVerified
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
                onClick={() => {
                  if (company?.profileCompleted && company?.isVerified) {
                    navigate('/company/post-job');
                  }
                }}
                disabled={!company?.profileCompleted || !company?.isVerified}
              >
                <Plus className="h-4 w-4 mr-2" />
                Post a job
              </Button>
              
              {/* Notification message when button is disabled */}
              {(!company?.profileCompleted || !company?.isVerified) && (
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-500 max-w-xs">
                    {!company?.profileCompleted 
                      ? "Complete your profile to post jobs"
                      : !company?.isVerified 
                      ? "Awaiting admin approval to post jobs"
                      : "Complete profile and get approval to post jobs"
                    }
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/company/review-status')}
                    className="text-xs px-2 py-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                  >
                    Check Status
                  </Button>
                </div>
              )}
            </div>
            
            {/* Notification Bell */}
            <div className="relative">
              <Bell className="h-6 w-6 text-gray-600 hover:text-gray-900 cursor-pointer" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
            
            {/* Logout Button */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleLogout}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
            
          </div>
        </div>
      </header>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm border-r border-gray-200 relative">
          <nav className="p-6">
            <div className="space-y-1 mb-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Main</h3>
              <button 
                type="button"
                onClick={() => navigate('/company/dashboard')}
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
              >
                <Home className="h-5 w-5" />
                Dashboard
              </button>
              <button 
                type="button"
                onClick={() => navigate('/chat')}
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
              >
                <MessageSquare className="h-5 w-5" />
                Messages
              </button>
              <button 
                type="button"
                onClick={handleCompanyProfileClick} 
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
              >
                <Building2 className="h-5 w-5" />
                Company Profile
              </button>
              <button 
                type="button"
                onClick={() => navigate('/company/applications')}
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
              >
                <User className="h-5 w-5" />
                All Applicants
              </button>
              <button 
                type="button"
                className="flex items-center gap-3 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg font-medium w-full text-left"
                disabled
              >
                <Briefcase className="h-5 w-5" />
                Job Listing
              </button>
              <button 
                type="button"
                onClick={() => navigate('/company/interviews')}
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
              >
                <CalendarIcon className="h-5 w-5" />
                Interview Management
              </button>
              <button 
                type="button"
                onClick={() => navigate('/subscriptions')}
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
              >
                <CreditCard className="h-5 w-5" />
                Plans & Billing
              </button>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Setting</h3>
              <button 
                type="button"
                onClick={() => navigate('/company/settings')} 
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
              >
                <Settings className="h-5 w-5" />
                Settings
              </button>
              <button 
                type="button"
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
                disabled
              >
                <HelpCircle className="h-5 w-5" />
                Help Center
              </button>
            </div>
          </nav>
          
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Building2 className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <div className="text-sm font-medium">{company?.companyName || 'Company'}</div>
                <div className="text-xs text-gray-500">{company?.email || 'email@company.com'}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
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
                    onClick={() => navigate('/company/post-job')} 
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
                        <p className="text-sm text-gray-500">
                          Posted {new Date(job.createdAt).toLocaleDateString()}
                        </p>
                        
                        <div className="flex items-center gap-2">
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
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-6 border-t">
                      <div className="text-sm text-gray-600">
                        Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, jobs.length)} of {jobs.length} jobs
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage <= 1}
                          onClick={() => goToPage(currentPage - 1)}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <div className="flex items-center px-3">
                          <span className="text-sm text-gray-600">
                            Page {currentPage} of {totalPages}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentPage >= totalPages}
                          onClick={() => goToPage(currentPage + 1)}
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
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
          workLocation: selectedJob.workLocation || 'Not specified'
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
