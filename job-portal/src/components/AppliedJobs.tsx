import React, { useState, useEffect } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { applicationService, Application } from '../api/applicationService';
import { toast } from 'react-toastify';

interface AppliedJobsProps {
  userId: string;
}

const AppliedJobs: React.FC<AppliedJobsProps> = ({ userId }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [userId]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await applicationService.getUserApplications();
      setApplications(response.data.applications || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
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
      day: 'numeric'
    });
  };

  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application);
    setShowDetails(true);
  };

  const handleWithdrawApplication = async (applicationId: string) => {
    if (window.confirm('Are you sure you want to withdraw this application?')) {
      try {
        await applicationService.withdrawApplication(applicationId);
        toast.success('Application withdrawn successfully');
        fetchApplications(); // Refresh the list
      } catch (error) {
        console.error('Error withdrawing application:', error);
        toast.error('Failed to withdraw application');
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Applied Jobs</h2>
              <p className="text-gray-600">Track your job applications and their status</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {applications.length} application{applications.length !== 1 ? 's' : ''}
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
            <p className="text-gray-500 mb-6">You haven't applied to any jobs yet. Start exploring opportunities!</p>
            <a
              href="/jobs"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Browse Jobs
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((application) => (
              <div
                key={application.id}
                className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {application.jobTitle || 'Job Title'}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}>
                        {getStatusIcon(application.status)}
                        <span className="ml-1">{application.status}</span>
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center space-x-1">
                        <Building className="h-4 w-4" />
                        <span>{application.companyName || 'Company Name'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Applied {formatDate(application.appliedAt)}</span>
                      </div>
                    </div>

                    {application.expectedSalary && (
                      <div className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Expected Salary:</span> {application.expectedSalary}
                      </div>
                    )}

                    {application.coverLetter && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                        {application.coverLetter}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleViewDetails(application)}
                      className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      View Details
                    </button>
                    
                    {application.status === 'PENDING' && (
                      <button
                        onClick={() => handleWithdrawApplication(application.id)}
                        className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Withdraw
                      </button>
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
      </div>

      {/* Application Details Modal */}
      {showDetails && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Application Details</h3>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Job Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Briefcase className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{selectedApplication.jobTitle || 'Job Title'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span>{selectedApplication.companyName || 'Company Name'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>Applied on {formatDate(selectedApplication.appliedAt)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(selectedApplication.status)}
                      <span className={`font-medium ${getStatusColor(selectedApplication.status).split(' ')[1]}`}>
                        {selectedApplication.status}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedApplication.coverLetter && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Cover Letter</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedApplication.coverLetter}</p>
                    </div>
                  </div>
                )}

                {selectedApplication.expectedSalary && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Expected Salary</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700">{selectedApplication.expectedSalary}</p>
                    </div>
                  </div>
                )}

                {selectedApplication.availability && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Availability</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700">{selectedApplication.availability}</p>
                    </div>
                  </div>
                )}

                {selectedApplication.experience && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Experience</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700">{selectedApplication.experience}</p>
                    </div>
                  </div>
                )}

                {selectedApplication.resumeUrl && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Resume</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <a
                        href={selectedApplication.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download Resume</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                {selectedApplication.status === 'PENDING' && (
                  <button
                    onClick={() => {
                      handleWithdrawApplication(selectedApplication.id);
                      setShowDetails(false);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Withdraw Application
                  </button>
                )}
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
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
