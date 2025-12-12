import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import {
  MapPin,
  Briefcase,
  Clock,
  Building2,
  ArrowLeft,
  CheckCircle,
  Star,
  ExternalLink,
  Users,
  Calendar,
  Flag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import JobApplicationModal from '@/components/JobApplicationModal';
import CompanyProfileModal from '../components/CompanyProfileModal';
import ReportJobModal from '@/components/ReportJobModal';
import { FiRefreshCw } from 'react-icons/fi';

interface Job {
  id: string;
  title: string;
  description: string;
  company: string;
  companyId?: string;
  location: string;
  salary?: number;
  jobType: string;
  requirements: string[];
  benefits: string[];
  experienceLevel: string;
  education: string;
  applicationDeadline: string;
  workLocation: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  hasApplied?: boolean;
}

interface JobDetailsResponse {
  success: boolean;
  data: {
    job: Job;
  };
  message: string;
  timestamp: string;
}


interface ApplicationData {
  coverLetter: string;
  resume: File | null;
  expectedSalary: string;
  availability: string;
  experience: string;
  resumeUrl?: string;
}

const JobDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchJobDetails();
    }
  }, [id]);

  useEffect(() => {
    if (id && isAuthenticated && role === 'jobseeker') {
      checkApplicationStatus();
    }
  }, [id, isAuthenticated, role]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching job details for ID:', id);
      const response = await api.get<JobDetailsResponse>(`/jobs/${id}`);
      console.log('Full API response ', response);
      console.log('Response Data', response.data);
      console.log('response Data Job', response.data.data.job);
      const job = response.data.data?.job;
      console.log('Job data ', job);
      if (job) {
        setJob(job);
      } else {
        setError('Job not found');
      }
    } catch (error: unknown) {
      console.error('Error fetching job details:', error);
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const axiosError = isAxiosError ? (error as { response?: { status?: number } }) : null;
      if (axiosError?.response?.status === 404) {
        setError('Job not found');
      } else {
        setError('Failed to load job details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    if (!id) return;

    try {
      setCheckingStatus(true);
      console.log('🔍 [JobDetails] Checking application status with axios');

      const response = await api.get<{
        data: { hasApplied: boolean; status?: string };
      }>(`/applications/check-status/${id}`);
      const hasApplied = response.data.data?.hasApplied || false;
      const status = response.data.data?.status;
      setApplied(hasApplied);
      setApplicationStatus(status || null);

      console.log('[JobDetails] Check status response:', response.data);
      console.log('[JobDetails] Application status:', hasApplied, 'Status:', status);
    } catch (error) {
      console.error('Error checking application status:', error);
      setApplied(false);
      setApplicationStatus(null);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }

    if (role !== 'jobseeker') {
      toast.error('Only job seekers can apply for jobs');
      return;
    }
    setShowApplicationModal(true);
  };

  const handleApplicationSubmit = async (applicationData: ApplicationData) => {
    console.log('Application submitted successfully via modal:', applicationData);
    setApplied(true);
    setShowApplicationModal(false);
    // Toast message is handled in JobApplicationModal component

    // Re-check application status to ensure consistency
    if (id) {
      await checkApplicationStatus();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getJobTypeColor = (jobType: string) => {
    const colors: { [key: string]: string } = {
      'full-time': 'bg-green-100 text-green-800',
      'part-time': 'bg-blue-100 text-blue-800',
      'contract': 'bg-purple-100 text-purple-800',
      'internship': 'bg-orange-100 text-orange-800',
    };
    return colors[jobType] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-6xl mb-4">😞</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The job you are looking for does not exist.'}</p>
            <Link
              to="/jobs"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <nav className="flex items-center space-x-2 text-sm">
            <Link to="/" className="text-gray-500 hover:text-gray-700">Home</Link>
            <span className="text-gray-400">/</span>
            <Link to="/jobs" className="text-gray-500 hover:text-gray-700">Jobs</Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">{job.title}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-gray-900 mb-3">{job.title}</h1>
                  <div className="flex items-center text-gray-600 mb-4">
                    <Building2 className="h-6 w-6 mr-3 text-blue-600" />
                    <span className="text-xl font-semibold">{job.company}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${getJobTypeColor(job.jobType)}`}>
                    {job.jobType.charAt(0).toUpperCase() + job.jobType.slice(1)}
                  </span>
                  {job.isActive ? (
                    <span className="px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  ) : (
                    <span className="px-4 py-2 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      Inactive
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="flex items-center text-gray-600 bg-gray-50 rounded-lg p-4">
                  <MapPin className="h-5 w-5 mr-3 text-blue-600" />
                  <span className="font-medium">{job.location}</span>
                </div>
                <div className="flex items-center text-gray-600 bg-gray-50 rounded-lg p-4">
                  <Clock className="h-5 w-5 mr-3 text-green-600" />
                  <span className="font-medium">Posted {formatDate(job.createdAt)}</span>
                </div>
                {job.salary && (
                  <div className="flex items-center text-gray-600 bg-gray-50 rounded-lg p-4">
                    <span className="text-2xl font-bold text-green-600 mr-3">₹</span>
                    <span className="font-medium">{job.salary.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Additional Job Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center text-gray-600 bg-gray-50 rounded-lg p-4">
                  <Briefcase className="h-5 w-5 mr-3 text-purple-600" />
                  <div>
                    <span className="text-sm text-gray-500">Experience</span>
                    <div className="font-medium">{job.experienceLevel}</div>
                  </div>
                </div>
                <div className="flex items-center text-gray-600 bg-gray-50 rounded-lg p-4">
                  <Star className="h-5 w-5 mr-3 text-yellow-600" />
                  <div>
                    <span className="text-sm text-gray-500">Education</span>
                    <div className="font-medium">{job.education}</div>
                  </div>
                </div>
                <div className="flex items-center text-gray-600 bg-gray-50 rounded-lg p-4">
                  <Users className="h-5 w-5 mr-3 text-indigo-600" />
                  <div>
                    <span className="text-sm text-gray-500">Work Location</span>
                    <div className="font-medium">{job.workLocation}</div>
                  </div>
                </div>
                <div className="flex items-center text-gray-600 bg-gray-50 rounded-lg p-4">
                  <Calendar className="h-5 w-5 mr-3 text-red-600" />
                  <div>
                    <span className="text-sm text-gray-500">Deadline</span>
                    <div className="font-medium">{formatDate(job.applicationDeadline)}</div>
                  </div>
                </div>
              </div>

              {!job.isActive && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <div className="text-red-400 mr-3">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-red-800">This job is no longer active</h3>
                      <p className="text-sm text-red-700 mt-1">Applications are no longer being accepted for this position.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Job Description Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Job Description</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{job.description}</p>
              </div>
            </div>

            {/* Requirements Card */}
            {job.requirements.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Requirements</h2>
                <ul className="space-y-4">
                  {job.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-green-500 mr-4 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 leading-relaxed">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Benefits Card */}
            {job.benefits.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Benefits & Perks</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {job.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center bg-yellow-50 rounded-lg p-4">
                      <Star className="h-5 w-5 text-yellow-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Button Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
              <div className="text-center">
                {applied ? (
                  <div className="text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Application Submitted!</h3>
                    <p className="text-gray-600 text-sm mb-6">
                      Your application has been successfully submitted. The company will review your profile and get back to you.
                    </p>
                    <Link
                      to="/jobs"
                      className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      Browse More Jobs
                    </Link>
                  </div>
                ) : (
                  <div>
                    {applicationStatus === 'WITHDRAWN' ? (
                      <div className="space-y-3">
                        <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-yellow-800 font-medium">Application Withdrawn</p>
                          <p className="text-yellow-600 text-sm mt-1">You can re-apply for this position</p>
                        </div>
                        <button
                          onClick={handleApplyClick}
                          disabled={applying || !job.isActive || checkingStatus}
                          className="w-full px-6 py-4 rounded-lg font-semibold text-lg transition-all duration-200 bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5 disabled:bg-blue-400 disabled:cursor-not-allowed"
                        >
                          {applying ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                              Applying...
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <FiRefreshCw className="mr-2" />
                              Re-apply
                            </div>
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleApplyClick}
                        disabled={applying || !job.isActive || applied || checkingStatus}
                        className={`w-full px-6 py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${!job.isActive
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : applied
                            ? 'bg-green-600 text-white cursor-not-allowed'
                            : applying || checkingStatus
                              ? 'bg-blue-400 text-white cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:-translate-y-0.5'
                          }`}
                      >
                        {applying ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                            Applying...
                          </div>
                        ) : checkingStatus ? (
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                            Checking...
                          </div>
                        ) : !job.isActive ? (
                          'Job No Longer Active'
                        ) : applied ? (
                          'Already Applied'
                        ) : (
                          'Apply for this Job'
                        )}
                      </button>
                    )}

                    {!isAuthenticated && (
                      <p className="text-sm text-gray-500 mt-4">
                        <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                          Sign in
                        </Link> to apply for this job
                      </p>
                    )}

                    {isAuthenticated && role !== 'jobseeker' && (
                      <p className="text-sm text-gray-500 mt-4">
                        Only job seekers can apply for jobs
                      </p>
                    )}
                  </div>
                )}

                {/* Report Job Button */}
                {isAuthenticated && (
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="w-full mt-3 px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Flag className="h-4 w-4" />
                    Report Job
                  </button>
                )}
              </div>
            </div>

            {/* Job Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Job Information</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Job Type</span>
                  <span className="font-semibold text-gray-900">{job.jobType.charAt(0).toUpperCase() + job.jobType.slice(1)}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Location</span>
                  <span className="font-semibold text-gray-900">{job.location}</span>
                </div>
                {job.salary && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Salary</span>
                    <span className="font-semibold text-gray-900">₹ {job.salary}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600 font-medium">Posted</span>
                  <span className="font-semibold text-gray-900">{formatDate(job.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-600 font-medium">Status</span>
                  <span className={`font-semibold ${job.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {job.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Company Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">About {job.company}</h3>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                Learn more about {job.company} and their company culture, values, and mission.
              </p>
              <button
                onClick={() => setShowCompanyModal(true)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Company Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Job Application Modal */}
      {job && (
        <JobApplicationModal
          isOpen={showApplicationModal}
          onClose={() => setShowApplicationModal(false)}
          jobId={job.id}
          jobTitle={job.title}
          companyName={job.company}
          companyId={job.companyId}
          onApplicationSubmit={handleApplicationSubmit}
        />
      )}
      <CompanyProfileModal
        isOpen={showCompanyModal}
        onClose={() => setShowCompanyModal(false)}
        companyName={job.company}
      />
      {job && (
        <ReportJobModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          jobId={job.id}
          jobTitle={job.title}
        />
      )}
    </div>
  );
};

export default JobDetails;