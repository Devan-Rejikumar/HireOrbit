import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Phone, 
  ArrowLeft, 
  Loader2, 
  Edit, 
  Trash2, 
  User,
  Building2,
  Filter,
  Search
} from 'lucide-react';
import { interviewService, InterviewWithDetails, UpdateInterviewData, InterviewDecisionData } from '@/api/interviewService';
import { toast } from 'react-toastify';
import EditInterviewModal from '@/components/EditInterviewModal';
import InterviewDecisionModal from '@/components/InterviewDecisionModal';

const CompanyInterviewManagement = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<InterviewWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInterview, setSelectedInterview] = useState<InterviewWithDetails | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInterview, setEditingInterview] = useState<InterviewWithDetails | null>(null);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionInterview, setDecisionInterview] = useState<InterviewWithDetails | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<'SELECTED' | 'REJECTED' | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await interviewService.getCompanyInterviews();
      setInterviews(response.data || []);
    } catch (err: any) {
      console.error('Failed to fetch interviews:', err);
      setError(err.response?.data?.message || 'Failed to load interviews');
      toast.error('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ONLINE': return <Video className="w-4 h-4" />;
      case 'OFFLINE': return <MapPin className="w-4 h-4" />;
      case 'PHONE': return <Phone className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredInterviews = interviews.filter(interview => {
    if (statusFilter === 'ALL') return true;
    return interview.status === statusFilter;
  });

  const handleEditInterview = (interview: InterviewWithDetails) => {
    setEditingInterview(interview);
    setShowEditModal(true);
  };

  const handleUpdateInterview = async (interviewId: string, updateData: UpdateInterviewData) => {
    try {
      await interviewService.updateInterview(interviewId, updateData);
      toast.success('Interview updated successfully!');
      setShowEditModal(false);
      setEditingInterview(null);
      fetchInterviews();
    } catch (err: any) {
      console.error('Failed to update interview:', err);
      toast.error(err.response?.data?.message || 'Failed to update interview');
    }
  };

  const handleCancelInterview = async (interviewId: string) => {
    if (!window.confirm('Are you sure you want to cancel this interview?')) {
      return;
    }

    try {
      await interviewService.cancelInterview(interviewId, 'Cancelled by company');
      toast.success('Interview cancelled successfully!');
      fetchInterviews();
    } catch (err: any) {
      console.error('Failed to cancel interview:', err);
      toast.error(err.response?.data?.message || 'Failed to cancel interview');
    }
  };

  const handleStatusUpdate = async (interviewId: string, newStatus: string) => {
    try {
      await interviewService.updateInterview(interviewId, { status: newStatus as any });
      toast.success(`Interview status updated to ${newStatus}`);
      fetchInterviews();
    } catch (err: any) {
      console.error('Failed to update interview status:', err);
      toast.error('Failed to update interview status');
    }
  };

  const handleMakeDecision = async (decisionData: InterviewDecisionData) => {
    if (!decisionInterview) return;

    try {
      await interviewService.makeInterviewDecision(decisionInterview.id, decisionData);
      toast.success(`Candidate ${decisionData.status.toLowerCase()} successfully!`);
      setShowDecisionModal(false);
      setDecisionInterview(null);
      setSelectedDecision(null);
      fetchInterviews();
    } catch (err: any) {
      console.error('Failed to make interview decision:', err);
      toast.error(err.response?.data?.message || 'Failed to make interview decision');
    }
  };

  const openDecisionModal = (interview: InterviewWithDetails, decision: 'SELECTED' | 'REJECTED') => {
    setDecisionInterview(interview);
    setSelectedDecision(decision);
    setShowDecisionModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading interviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/company/dashboard')} 
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Interview Management</h1>
            <p className="text-gray-600">Manage and track all your scheduled interviews</p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Interviews</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchInterviews}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Interviews List */}
      {filteredInterviews.length > 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {filteredInterviews.map((interview) => {
                const { date, time } = formatDateTime(interview.scheduledAt);
                const isUpcoming = new Date(interview.scheduledAt) > new Date() && interview.status !== 'CANCELLED';
                
                return (
                  <div key={interview.id} className={`border rounded-lg p-6 ${isUpcoming ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {interview.jobTitle}
                          </h3>
                          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(interview.status)}`}>
                            {interview.status}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{interview.candidateName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            <span>{interview.companyName}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span>{date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span>{time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(interview.type)}
                            <span className="capitalize">{interview.type.toLowerCase()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span>{interview.duration} minutes</span>
                          </div>
                        </div>

                        {interview.location && (
                          <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{interview.location}</span>
                          </div>
                        )}

                        {interview.meetingLink && (
                          <div className="mt-3">
                            <a
                              href={interview.meetingLink.startsWith('http') ? interview.meetingLink : `https://${interview.meetingLink}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm underline"
                            >
                              <Video className="w-4 h-4" />
                              Join Meeting
                            </a>
                          </div>
                        )}

                        {interview.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-md">
                            <p className="text-sm text-gray-700">
                              <strong>Notes:</strong> {interview.notes}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {isUpcoming && interview.status !== 'CANCELLED' && (
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditInterview(interview)}
                            className="flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </Button>
                          
                          {interview.status === 'PENDING' && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(interview.id, 'CONFIRMED')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Confirm
                            </Button>
                          )}
                          
                          {interview.status === 'CONFIRMED' && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate(interview.id, 'COMPLETED')}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Mark Complete
                            </Button>
                          )}

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelInterview(interview.id)}
                            className="flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Cancel
                          </Button>
                        </div>
                      )}

                      {/* Decision Buttons for Completed Interviews */}
                      {interview.status === 'COMPLETED' && interview.status !== 'SELECTED' && interview.status !== 'REJECTED' && (
                        <div className="flex flex-col gap-2 ml-4">
                          <div className="text-sm font-medium text-gray-700 mb-2">Interview Decision:</div>
                          <Button
                            size="sm"
                            onClick={() => openDecisionModal(interview, 'SELECTED')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Select Candidate
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDecisionModal(interview, 'REJECTED')}
                          >
                            Reject Candidate
                          </Button>
                        </div>
                      )}

                      {/* Show Decision Info for Selected/Rejected Interviews */}
                      {(interview.status === 'SELECTED' || interview.status === 'REJECTED') && (
                        <div className="ml-4 p-3 bg-gray-50 rounded-md">
                          <div className="text-sm">
                            <div className="font-medium text-gray-700">
                              Status: <span className={interview.status === 'SELECTED' ? 'text-green-600' : 'text-red-600'}>{interview.status}</span>
                            </div>
                            {interview.decisionReason && (
                              <div className="mt-1 text-gray-600">
                                <strong>Reason:</strong> {interview.decisionReason}
                              </div>
                            )}
                            {interview.feedback && (
                              <div className="mt-1 text-gray-600">
                                <strong>Feedback:</strong> {interview.feedback}
                              </div>
                            )}
                            {interview.decidedAt && (
                              <div className="mt-1 text-xs text-gray-500">
                                Decided: {new Date(interview.decidedAt).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No interviews found</h3>
            <p className="text-gray-600 mb-4">
              {statusFilter === 'ALL' 
                ? "You don't have any scheduled interviews yet."
                : `No interviews with status "${statusFilter}" found.`
              }
            </p>
            <Button 
              onClick={() => navigate('/company/applications')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Schedule New Interview
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Edit Interview Modal */}
      <EditInterviewModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingInterview(null);
        }}
        interview={editingInterview}
        onSuccess={handleUpdateInterview}
      />

      {/* Decision Modal */}
      <InterviewDecisionModal
        isOpen={showDecisionModal}
        onClose={() => {
          setShowDecisionModal(false);
          setDecisionInterview(null);
          setSelectedDecision(null);
        }}
        interview={decisionInterview}
        decision={selectedDecision}
        onSuccess={handleMakeDecision}
      />
    </div>
  );
};

export default CompanyInterviewManagement;
