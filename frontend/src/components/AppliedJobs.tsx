import React, { useState, useEffect, useMemo } from 'react';
import { ROUTES } from '../constants/routes';
import { 
  Briefcase, 
  Calendar, 
  MapPin, 
  Building, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Download,
  ExternalLink,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { _applicationService, Application } from '../api/applicationService';
import toast from 'react-hot-toast';
import { ChatButton } from './ChatButton';

interface AppliedJobsProps {
  userId: string;
}

const AppliedJobs: React.FC<AppliedJobsProps> = ({ userId }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalApplications, setTotalApplications] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [statusFilter, searchTerm]);

  useEffect(() => {
    fetchApplications();
  }, [userId, currentPage, statusFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const status = statusFilter !== 'all' ? statusFilter : undefined;
      const response = await _applicationService.getUserApplications(currentPage, itemsPerPage, status);
      const apps = response.data.applications || [];
      setApplications(apps);
      setTotalApplications(response.data.pagination?.total || apps.length);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error) {
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
    case 'PENDING':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'REVIEWING':
      return <Eye className="h-4 w-4 text-blue-500" />;
    case 'SHORTLISTED':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'ACCEPTED':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'REJECTED':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'WITHDRAWN':
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'REVIEWING':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'SHORTLISTED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'ACCEPTED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'REJECTED':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'WITHDRAWN':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Client-side search filtering (since jobTitle/companyName are enriched)
  const filteredApplications = useMemo(() => {
    if (!searchTerm) return applications;

    const searchLower = searchTerm.toLowerCase();
    return applications.filter(
      (app) =>
        app.jobTitle?.toLowerCase().includes(searchLower) ||
        app.companyName?.toLowerCase().includes(searchLower) ||
        app.status.toLowerCase().includes(searchLower),
    );
  }, [applications, searchTerm]);

  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application);
    setShowDetails(true);
  };

  const handleWithdrawApplication = async (applicationId: string) => {
    try {
      await _applicationService.withdrawApplication(applicationId);
      toast.success('Application withdrawn successfully');
      fetchApplications(); 
    } catch (error) {
      toast.error('Failed to withdraw application');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 sm:w-1/3 mb-4"></div>
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 sm:h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">Applied Jobs</h2>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Track your job applications and their status</p>
            </div>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-lg self-start sm:self-auto">
            {totalApplications} application{totalApplications !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="REVIEWING">Reviewing</option>
            <option value="SHORTLISTED">Shortlisted</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>
        </div>

        {filteredApplications.length === 0 && !loading ? (
          <div className="text-center py-8 sm:py-12">
            <Briefcase className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
            <p className="text-sm sm:text-base text-gray-500 mb-6 px-4">You haven't applied to any jobs yet. Start exploring opportunities!</p>
            <a
              href={ROUTES.JOBS}
              className="inline-flex items-center px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Browse Jobs
            </a>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredApplications.map((application) => (
              <div
                key={application.id}
                className="border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Title and Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                        {application.jobTitle || 'Job Title'}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(application.status)} self-start`}>
                        {getStatusIcon(application.status)}
                        <span className="ml-1">{application.status}</span>
                      </span>
                    </div>
                    
                    {/* Company and Date */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <Building className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">{application.companyName || 'Company Name'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="whitespace-nowrap">Applied {formatDate(application.appliedAt)}</span>
                      </div>
                    </div>

                    {application.expectedSalary && (
                      <div className="text-xs sm:text-sm text-gray-600 mb-3">
                        <span className="font-medium">Expected Salary:</span> {application.expectedSalary}
                      </div>
                    )}

                    {application.coverLetter && (
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3 sm:mb-0">
                        {application.coverLetter}
                      </p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex sm:flex-col items-center gap-2 sm:ml-4 flex-wrap">
                    <button
                      onClick={() => handleViewDetails(application)}
                      className="flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
                    >
                      View Details
                    </button>
                    
                    {application.status === 'PENDING' && (
                      <button
                        onClick={() => handleWithdrawApplication(application.id)}
                        className="flex-1 sm:flex-none px-3 py-1.5 text-xs sm:text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap"
                      >
                        Withdraw
                      </button>
                    )}
                    
                    {application.status === 'SHORTLISTED' && (
                      <div className="flex-1 sm:flex-none">
                        <ChatButton applicationId={application.id} size="sm" />
                      </div>
                    )}

                    {application.resumeUrl && (
                      <a
                        href={application.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Download Resume"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && filteredApplications.length > 0 && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
            <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalApplications)} of {totalApplications}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-2 sm:px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Previous</span>
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages <= 5 ? 5 : 3, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 2) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 1) {
                    pageNum = totalPages - 2 + i;
                  } else {
                    pageNum = currentPage - 1 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-2 sm:px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-2 text-xs sm:text-sm"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {showDetails && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Application Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <XCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">Job Information</h4>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-2.5">
                    <div className="flex items-center space-x-2">
                      <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base truncate">{selectedApplication.jobTitle || 'Job Title'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Building className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm sm:text-base truncate">{selectedApplication.companyName || 'Company Name'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                      <span className="text-sm sm:text-base">Applied on {formatDate(selectedApplication.appliedAt)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedApplication.status)}
                      <span className={`font-medium text-sm sm:text-base ${getStatusColor(selectedApplication.status).split(' ')[1]}`}>
                        {selectedApplication.status}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedApplication.coverLetter && (
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">Cover Letter</h4>
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap">{selectedApplication.coverLetter}</p>
                    </div>
                  </div>
                )}

                {selectedApplication.expectedSalary && (
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">Expected Salary</h4>
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-gray-700">{selectedApplication.expectedSalary}</p>
                    </div>
                  </div>
                )}

                {selectedApplication.availability && (
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">Availability</h4>
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-gray-700">{selectedApplication.availability}</p>
                    </div>
                  </div>
                )}

                {selectedApplication.experience && (
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">Experience</h4>
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <p className="text-xs sm:text-sm text-gray-700">{selectedApplication.experience}</p>
                    </div>
                  </div>
                )}

                {selectedApplication.resumeUrl && (
                  <div>
                    <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">Resume</h4>
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <a
                        href={selectedApplication.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm sm:text-base"
                      >
                        <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span>Download Resume</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 mt-4 sm:mt-6">
                {selectedApplication.status === 'PENDING' && (
                  <button
                    onClick={() => {
                      handleWithdrawApplication(selectedApplication.id);
                      setShowDetails(false);
                    }}
                    className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Withdraw Application
                  </button>
                )}
                <button
                  onClick={() => setShowDetails(false)}
                  className="w-full sm:w-auto px-4 py-2 text-sm sm:text-base bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AppliedJobs;
