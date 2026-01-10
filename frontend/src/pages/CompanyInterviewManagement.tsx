import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Phone, 
  Edit, 
  Trash2, 
  User,
  Filter,
  Search,
  Eye,
  X,
  CheckCircle,
} from 'lucide-react';
import { CompanyLayout } from '@/components/CompanyLayout';
import { useAuth } from '@/context/AuthContext';
import { _interviewService, InterviewWithDetails, UpdateInterviewData, InterviewDecisionData } from '@/api/interviewService';
import toast from 'react-hot-toast';
import EditInterviewModal from '@/components/EditInterviewModal';
import InterviewDecisionModal from '@/components/InterviewDecisionModal';
import ConfirmationModal from '@/components/ConfirmationModal';
import api from '@/api/axios';

interface CompanyProfile {
  companyName?: string;
  email?: string;
  profileCompleted?: boolean;
  isVerified?: boolean;
}

interface CompanyProfileResponse {
  success: boolean;
  data: {
    company: CompanyProfile;
    profileStep?: unknown;
  };
  message: string;
}

const CompanyInterviewManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { company: authCompany } = useAuth();
  const [interviews, setInterviews] = useState<InterviewWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInterview, setSelectedInterview] = useState<InterviewWithDetails | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInterview, setEditingInterview] = useState<InterviewWithDetails | null>(null);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [interviewToCancel, setInterviewToCancel] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [viewingInterview, setViewingInterview] = useState<InterviewWithDetails | null>(null);
  const [decisionInterview, setDecisionInterview] = useState<InterviewWithDetails | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<'SELECTED' | 'REJECTED' | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [company, setCompany] = useState<CompanyProfile & { id?: string; logo?: string } | null>(null);

  useEffect(() => {
    fetchInterviews();
    fetchCompanyProfile();
  }, [location.pathname]);

  const fetchCompanyProfile = async () => {
    try {
      const response = await api.get<CompanyProfileResponse>('/company/profile');
      setCompany(response.data?.data?.company || null);
    } catch (_error) {
      // Silently handle error
    }
  };

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await _interviewService.getCompanyInterviews();
      setInterviews(response.data || []);
    } catch (err: unknown) {
      const isAxiosError = err && typeof err === 'object' && 'response' in err;
      const axiosError = isAxiosError ? (err as { response?: { data?: { message?: string } } }) : null;
      setError(axiosError?.response?.data?.message || 'Failed to load interviews');
      toast.error('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    // Parse the ISO date string from backend (UTC)
    // Ensure it's treated as UTC by appending 'Z' if not present
    let utcDateString = dateString;
    if (!dateString.endsWith('Z') && !dateString.includes('+') && !dateString.includes('-', 10)) {
      // If it's an ISO string without timezone, assume UTC
      utcDateString = dateString.endsWith('Z') ? dateString : `${dateString}Z`;
    }
    
    // Parse as UTC and convert to local time
    const date = new Date(utcDateString);
    
    // Verify the date is valid
    if (isNaN(date.getTime())) {
      return { date: 'Invalid Date', time: 'Invalid Time' };
    }
    
    // Format date in local timezone
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    // Format time in local timezone
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    
    return {
      date: dateStr,
      time: timeStr,
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

  const filteredInterviews = interviews
    .filter(interview => {
      // Status filter
      if (statusFilter !== 'ALL' && interview.status !== statusFilter) {
        return false;
      }
      
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          interview.candidateName?.toLowerCase().includes(query) ||
          interview.jobTitle?.toLowerCase().includes(query) ||
          interview.companyName?.toLowerCase().includes(query) ||
          interview.location?.toLowerCase().includes(query)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      // Sort by scheduled date: most recent first
      const dateA = new Date(a.scheduledAt).getTime();
      const dateB = new Date(b.scheduledAt).getTime();
      return dateB - dateA;
    });

  const handleEditInterview = (interview: InterviewWithDetails) => {
    setEditingInterview(interview);
    setShowEditModal(true);
  };

  const handleUpdateInterview = async (interviewId: string, updateData: UpdateInterviewData) => {
    try {
      await _interviewService.updateInterview(interviewId, updateData);
      toast.success('Interview updated successfully!');
      setShowEditModal(false);
      setEditingInterview(null);
      fetchInterviews();
    } catch (err: unknown) {
      const isAxiosError = err && typeof err === 'object' && 'response' in err;
      const axiosError = isAxiosError ? (err as { response?: { data?: { message?: string } } }) : null;
      toast.error(axiosError?.response?.data?.message || 'Failed to update interview');
    }
  };

  const handleCancelInterview = (interviewId: string) => {
    setInterviewToCancel(interviewId);
    setShowCancelConfirmModal(true);
  };

  const confirmCancelInterview = async () => {
    if (!interviewToCancel) return;

    try {
      setCancelling(true);
      await _interviewService.cancelInterview(interviewToCancel, 'Cancelled by company');
      toast.success('Interview cancelled successfully!');
      setShowCancelConfirmModal(false);
      setInterviewToCancel(null);
      fetchInterviews();
    } catch (err: unknown) {
      const isAxiosError = err && typeof err === 'object' && 'response' in err;
      const axiosError = isAxiosError ? (err as { response?: { data?: { message?: string } } }) : null;
      toast.error(axiosError?.response?.data?.message || 'Failed to cancel interview');
    } finally {
      setCancelling(false);
    }
  };

  const handleStatusUpdate = async (interviewId: string, newStatus: string) => {
    try {
      await _interviewService.updateInterview(interviewId, { 
        status: newStatus as UpdateInterviewData['status'], 
      });
      toast.success(`Interview status updated to ${newStatus}`);
      fetchInterviews();
    } catch (_err: unknown) {
      toast.error('Failed to update interview status');
    }
  };

  const handleMakeDecision = async (decisionData: InterviewDecisionData) => {
    if (!decisionInterview) return;

    try {
      await _interviewService.makeInterviewDecision(decisionInterview.id, decisionData);
      toast.success(`Candidate ${decisionData.status.toLowerCase()} successfully!`);
      setShowDecisionModal(false);
      setDecisionInterview(null);
      setSelectedDecision(null);
      fetchInterviews();
    } catch (err: unknown) {
      const isAxiosError = err && typeof err === 'object' && 'response' in err;
      const axiosError = isAxiosError ? (err as { response?: { data?: { message?: string } } }) : null;
      toast.error(axiosError?.response?.data?.message || 'Failed to make interview decision');
    }
  };

  const openDecisionModal = (interview: InterviewWithDetails, decision: 'SELECTED' | 'REJECTED') => {
    setDecisionInterview(interview);
    setSelectedDecision(decision);
    setShowDecisionModal(true);
  };

  const openViewDetailsModal = (interview: InterviewWithDetails) => {
    setViewingInterview(interview);
    setShowViewDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-700">Loading interviews...</h3>
          <p className="text-gray-500">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  return (
    <CompanyLayout company={company}>
          <div className="mb-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview Management</h1>
              <p className="text-gray-600">Manage and track all your scheduled interviews</p>
            </div>
            
            {/* Search and Filter Bar */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by candidate name, job title, company, or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                </div>
                
                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm font-medium bg-white min-w-[160px]"
                  >
                    <option value="ALL">All Interviews</option>
                    <option value="PENDING">Pending</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>
              
              {/* Results Count */}
              {filteredInterviews.length > 0 && (
                <div className="mt-3 text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{filteredInterviews.length}</span> interview{filteredInterviews.length !== 1 ? 's' : ''}
                </div>
              )}
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
            <div className="space-y-4">
              {filteredInterviews.map((interview) => {
                const { date, time } = formatDateTime(interview.scheduledAt);
                const isUpcoming = new Date(interview.scheduledAt) > new Date() && interview.status !== 'CANCELLED';
                const isRecent = new Date(interview.scheduledAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            
                return (
                  <Card key={interview.id} className={`transition-all duration-200 hover:shadow-md ${isRecent && isUpcoming ? 'border-purple-200 bg-gradient-to-br from-purple-50/50 to-white' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-6">
                        <div className="w-full">
                          {/* Header Section */}
                          <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h3 className="text-xl font-bold text-gray-900">
                                  {interview.jobTitle}
                                </h3>
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(interview.status)}`}>
                                  {interview.status}
                                </span>
                                {isRecent && isUpcoming && (
                                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                                    Recent
                                  </span>
                                )}
                              </div>
                          
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-white" />
                                  </div>
                                  <span className="font-medium text-gray-900">{interview.candidateName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-4 h-4 text-gray-500" />
                                  <span className="text-gray-600">{interview.companyName}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Details Grid - Full width layout */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 w-full">
                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg w-full min-w-0">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="min-w-0 flex-1 overflow-hidden">
                                <div className="text-[10px] text-gray-500 font-medium">Date</div>
                                <div className="text-xs font-semibold text-gray-900 leading-tight truncate">{date.split(',')[0]}</div>
                                {date.includes(',') && (
                                  <div className="text-[10px] text-gray-600 leading-tight truncate">{date.split(',').slice(1).join(',').trim()}</div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg w-full min-w-0">
                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Clock className="w-4 h-4 text-green-600" />
                              </div>
                              <div className="min-w-0 flex-1 overflow-hidden">
                                <div className="text-[10px] text-gray-500 font-medium">Time</div>
                                <div className="text-xs font-semibold text-gray-900 truncate">{time}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg w-full min-w-0">
                              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                {getTypeIcon(interview.type)}
                              </div>
                              <div className="min-w-0 flex-1 overflow-hidden">
                                <div className="text-[10px] text-gray-500 font-medium">Type</div>
                                <div className="text-xs font-semibold text-gray-900 capitalize truncate">{interview.type.toLowerCase()}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg w-full min-w-0">
                              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Clock className="w-4 h-4 text-orange-600" />
                              </div>
                              <div className="min-w-0 flex-1 overflow-hidden">
                                <div className="text-[10px] text-gray-500 font-medium">Duration</div>
                                <div className="text-xs font-semibold text-gray-900 truncate">{interview.duration} min</div>
                              </div>
                            </div>
                          </div>

                          {interview.location && (
                            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg mb-4">
                              <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-900">{interview.location}</span>
                            </div>
                          )}

                          {interview.notes && (
                            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                              <p className="text-xs text-gray-700 line-clamp-2 break-words">
                                <strong className="text-amber-800">Notes:</strong> <span className="text-gray-800">{interview.notes}</span>
                              </p>
                            </div>
                          )}

                          {/* Action Buttons Section - Aligned with info cards */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                            {/* Join Call Buttons - Always visible when applicable */}
                            {interview.type === 'ONLINE' && interview.status === 'CONFIRMED' && (
                              <>
                                <Button
                                  onClick={() => navigate(`/interview/${interview.id}/video`)}
                                  className="bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 w-full shadow-sm py-2.5 text-sm font-semibold"
                                >
                                  <Video className="w-5 h-5" />
                                  Join Call
                                </Button>
                                {interview.meetingLink && (
                                  <a
                                    href={interview.meetingLink.startsWith('http') ? interview.meetingLink : `https://${interview.meetingLink}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors w-full"
                                    title="Use external meeting link as fallback"
                                  >
                                    <Video className="w-5 h-5" />
                                    External Meeting
                                  </a>
                                )}
                                {/* Action Buttons for CONFIRMED interviews */}
                                {isUpcoming && (
                                  <>
                                    <Button
                                      variant="outline"
                                      onClick={() => handleEditInterview(interview)}
                                      className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold"
                                    >
                                      <Edit className="w-5 h-5" />
                                      Edit
                                    </Button>
                                    <Button
                                      onClick={() => handleStatusUpdate(interview.id, 'COMPLETED')}
                                      className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2.5 text-sm font-semibold"
                                    >
                                      Mark Complete
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleCancelInterview(interview.id)}
                                      className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold"
                                    >
                                      <Trash2 className="w-5 h-5" />
                                      Cancel
                                    </Button>
                                  </>
                                )}
                              </>
                            )}
                            
                            {/* Meeting Link for non-ONLINE interviews */}
                            {interview.meetingLink && interview.type !== 'ONLINE' && (
                              <a
                                href={interview.meetingLink.startsWith('http') ? interview.meetingLink : `https://${interview.meetingLink}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-semibold transition-colors w-full"
                              >
                                <Video className="w-5 h-5" />
                                Join Meeting
                              </a>
                            )}

                            {/* Action Buttons for Upcoming Interviews (non-CONFIRMED ONLINE) */}
                            {isUpcoming && interview.status !== 'CANCELLED' && interview.status !== 'SELECTED' && interview.status !== 'REJECTED' && !(interview.type === 'ONLINE' && interview.status === 'CONFIRMED') && (
                              <>
                                <Button
                                  variant="outline"
                                  onClick={() => handleEditInterview(interview)}
                                  className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold"
                                >
                                  <Edit className="w-5 h-5" />
                                  Edit
                                </Button>
                          
                                {interview.status === 'PENDING' && (
                                  <Button
                                    onClick={() => handleStatusUpdate(interview.id, 'CONFIRMED')}
                                    className="bg-green-600 hover:bg-green-700 text-white w-full py-2.5 text-sm font-semibold"
                                  >
                                    Confirm
                                  </Button>
                                )}

                                <Button
                                  variant="destructive"
                                  onClick={() => handleCancelInterview(interview.id)}
                                  className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-semibold"
                                >
                                  <Trash2 className="w-5 h-5" />
                                  Cancel
                                </Button>
                              </>
                            )}

                            {/* View Details Button for Completed Interviews */}
                            {interview.status === 'COMPLETED' && (
                              <Button
                                onClick={() => openViewDetailsModal(interview)}
                                className="bg-purple-600 hover:bg-purple-700 text-white w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold col-span-2 sm:col-span-4"
                              >
                                <Eye className="w-5 h-5" />
                                View Details
                              </Button>
                            )}

                            {/* View Details Button for Selected/Rejected Interviews */}
                            {(interview.status === 'SELECTED' || interview.status === 'REJECTED') && (
                              <Button
                                variant="outline"
                                onClick={() => openViewDetailsModal(interview)}
                                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold col-span-2 sm:col-span-4"
                              >
                                <Eye className="w-5 h-5" />
                                View Details
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No interviews found</h3>
                <p className="text-gray-600 mb-4">
                  {statusFilter === 'ALL' 
                    ? 'You don\'t have any scheduled interviews yet.'
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

          {/* Cancel Confirmation Modal */}
          <ConfirmationModal
            isOpen={showCancelConfirmModal}
            onClose={() => {
              setShowCancelConfirmModal(false);
              setInterviewToCancel(null);
            }}
            onConfirm={confirmCancelInterview}
            title="Cancel Interview"
            message="Are you sure you want to cancel this interview? This action cannot be undone."
            confirmText="Cancel Interview"
            cancelText="Keep Interview"
            type="danger"
            loading={cancelling}
          />

          {/* View Details Modal for Completed/Selected/Rejected Interviews */}
          {showViewDetailsModal && viewingInterview && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Interview Details</h2>
                  <button
                    onClick={() => {
                      setShowViewDetailsModal(false);
                      setViewingInterview(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Interview Info */}
                <div className="p-6 space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Candidate</div>
                      <div className="text-sm font-medium text-gray-900">{viewingInterview.candidateName}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Job Title</div>
                      <div className="text-sm font-medium text-gray-900">{viewingInterview.jobTitle}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Company</div>
                      <div className="text-sm font-medium text-gray-900">{viewingInterview.companyName}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</div>
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(viewingInterview.status)}`}>
                        {viewingInterview.status}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Date & Time</div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatDateTime(viewingInterview.scheduledAt).date} at {formatDateTime(viewingInterview.scheduledAt).time}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Type</div>
                      <div className="text-sm font-medium text-gray-900 capitalize">{viewingInterview.type.toLowerCase()}</div>
                    </div>
                  </div>

                  {/* Decision Info for Selected/Rejected */}
                  {(viewingInterview.status === 'SELECTED' || viewingInterview.status === 'REJECTED') && (
                    <div className={`p-4 rounded-lg border-2 ${
                      viewingInterview.status === 'SELECTED' 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center gap-2 mb-3">
                        {viewingInterview.status === 'SELECTED' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <X className="w-5 h-5 text-red-600" />
                        )}
                        <h3 className={`font-semibold ${
                          viewingInterview.status === 'SELECTED' ? 'text-green-800' : 'text-red-800'
                        }`}>
                          Decision: {viewingInterview.status}
                        </h3>
                      </div>
                      {viewingInterview.decisionReason && (
                        <div className="mb-2">
                          <div className="text-xs font-semibold text-gray-600 mb-1">Reason:</div>
                          <div className="text-sm text-gray-800">{viewingInterview.decisionReason}</div>
                        </div>
                      )}
                      {viewingInterview.feedback && (
                        <div className="mb-2">
                          <div className="text-xs font-semibold text-gray-600 mb-1">Feedback:</div>
                          <div className="text-sm text-gray-800">{viewingInterview.feedback}</div>
                        </div>
                      )}
                      {viewingInterview.decidedAt && (
                        <div className="text-xs text-gray-500 mt-2">
                          Decided on: {new Date(viewingInterview.decidedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Decision Buttons for Completed Interviews */}
                  {viewingInterview.status === 'COMPLETED' && (
                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-4">Make Interview Decision:</h3>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          size="sm"
                          onClick={() => {
                            setShowViewDetailsModal(false);
                            openDecisionModal(viewingInterview, 'SELECTED');
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white flex-1 flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Select Candidate
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setShowViewDetailsModal(false);
                            openDecisionModal(viewingInterview, 'REJECTED');
                          }}
                          className="flex-1 flex items-center justify-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Reject Candidate
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {viewingInterview.notes && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="text-xs font-semibold text-amber-800 mb-1">Notes:</div>
                      <div className="text-sm text-gray-800">{viewingInterview.notes}</div>
                    </div>
                  )}

                  {/* Location */}
                  {viewingInterview.location && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                      <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-900">{viewingInterview.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
    </CompanyLayout>
  );
};

export default CompanyInterviewManagement;

