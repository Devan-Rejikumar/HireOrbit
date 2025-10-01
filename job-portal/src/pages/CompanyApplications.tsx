import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Download, Eye, ArrowLeft, Loader2 } from 'lucide-react';
import api from '@/api/axios';

interface Application {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  jobTitle: string;
  status: string;
  coverLetter: string;
  expectedSalary: string;
  experience: string;
  resumeUrl?: string;
  appliedAt: string;
  userProfile?: unknown;
}

const CompanyApplications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  useEffect(() => {
      fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ data?: { applications?: Application[] } }>('/applications/company/applications');
      console.log('📥 Applications response:', res.data);
      setApplications(res.data.data?.applications || []);
    } catch (error) {
      console.error('❌ Error fetching applications:', error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResume = async (applicantName: string, resumeUrl?: string, applicationId?: string) => {
    if (!resumeUrl) return;
    
    // Try to open directly first (works for public URLs)
    const newWindow = window.open(resumeUrl, '_blank');
    
    // If it fails to open or Cloudinary blocks, show download option
    if (!newWindow) {
      alert('Pop-up blocked! Please allow pop-ups or click Download button instead.');
    }
  };

  const handleDownloadResume = (resumeUrl?: string) => {
    if (resumeUrl) {
      // Force download by adding download flag to Cloudinary URL
      const downloadUrl = resumeUrl.replace('/upload/', '/upload/fl_attachment/');
      window.open(downloadUrl, '_blank');
    }
  };

  const handleStatusUpdate = async (applicationId: string, newStatus: string) => {
    try {
      await api.put(`/applications/${applicationId}/status`, { 
        status: newStatus,
        reason: `Status updated to ${newStatus}` 
      });
      fetchApplications(); // Refresh the list
    } catch (error) {
      console.error('❌ Error updating status:', error);
    }
  };

  const filteredApps = statusFilter === 'ALL' 
    ? applications 
    : applications.filter(app => app.status === statusFilter);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/company/dashboard')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Job Applicants</h1>
        <p className="text-gray-600">Manage and review your job applications</p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['ALL', 'PENDING', 'REVIEWING', 'SHORTLISTED', 'ACCEPTED', 'REJECTED'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              statusFilter === status 
                ? 'bg-purple-600 text-white shadow-lg' 
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {status} ({applications.filter(a => status === 'ALL' || a.status === status).length})
          </button>
        ))}
      </div>

      {/* Applications List */}
      <div className="grid gap-4">
        {filteredApps.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No applications found</p>
            </CardContent>
          </Card>
        ) : (
          filteredApps.map(app => (
            <Card key={app.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  {/* Left Side - Applicant Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{app.userName}</h3>
                        <p className="text-purple-600 font-medium">{app.jobTitle}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 space-y-2 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        📧 <span>{app.userEmail}</span>
                      </p>
                      {app.userPhone && (
                        <p className="flex items-center gap-2">
                          📞 <span>{app.userPhone}</span>
                        </p>
                      )}
                      <p className="flex items-center gap-2">
                        💰 <span>Expected: {app.expectedSalary}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        💼 <span>Experience: {app.experience}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        📅 <span>Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                      </p>
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">Cover Letter:</p>
                      <p className="text-sm text-gray-600 line-clamp-3">{app.coverLetter}</p>
                    </div>
                  </div>

                  {/* Right Side - Actions */}
                  <div className="ml-6 space-y-3">
                    {/* Status Dropdown */}
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Status</label>
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="REVIEWING">Reviewing</option>
                        <option value="SHORTLISTED">Shortlisted</option>
                        <option value="ACCEPTED">Accepted</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </div>

                    {/* View Details Button */}
                    <Button 
                      onClick={() => setSelectedApp(app)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>

                    {/* View Resume */}
                    {app.resumeUrl && (
                      <>
                        <Button 
                          onClick={() => handleViewResume(app.userName, app.resumeUrl, app.id)}
                          variant="outline"
                          className="w-full border-purple-600 text-purple-600 hover:bg-purple-50"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Resume
                        </Button>
                        <Button 
                          onClick={() => handleDownloadResume(app.resumeUrl)}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Download className="h-3 w-3 mr-2" />
                          Download
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
              <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedApp.userName}</h2>
                  <p className="text-purple-600 font-medium">{selectedApp.jobTitle}</p>
                </div>
                <button 
                  onClick={() => setSelectedApp(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-6">
                {/* Contact Info */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Contact Information</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <p className="flex items-center gap-2">📧 <span>{selectedApp.userEmail}</span></p>
                    {selectedApp.userPhone && <p className="flex items-center gap-2">📞 <span>{selectedApp.userPhone}</span></p>}
                  </div>
                </div>

                {/* Application Details */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Application Details</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <p>💰 Expected Salary: <strong>{selectedApp.expectedSalary}</strong></p>
                    <p>💼 Experience: <strong>{selectedApp.experience}</strong></p>
                    <p>📅 Applied: <strong>{new Date(selectedApp.appliedAt).toLocaleDateString()}</strong></p>
                    <p>📊 Status: <strong className="text-purple-600">{selectedApp.status}</strong></p>
                  </div>
                </div>

                {/* Cover Letter */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Cover Letter</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedApp.coverLetter}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  {selectedApp.resumeUrl && (
                    <>
                      <Button 
                        onClick={() => handleViewResume(selectedApp.userName, selectedApp.resumeUrl, selectedApp.id)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Resume
                      </Button>
                      <Button 
                        onClick={() => handleDownloadResume(selectedApp.resumeUrl)}
                        variant="outline"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Resume
                      </Button>
                    </>
                  )}
                  <Button variant="outline" onClick={() => setSelectedApp(null)}>
                    Close
                  </Button>
                </div>
              </div>
            </div>
      </div>
        </div>
      )}
    </div>
  );
};

export default CompanyApplications;
