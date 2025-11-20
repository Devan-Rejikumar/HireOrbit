import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, MapPin, Video, Phone, ArrowLeft, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { _interviewService, InterviewWithDetails } from '@/api/_interviewService';
import { toast } from 'react-toastify';

const MySchedule = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<InterviewWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (role !== 'jobseeker') {
      navigate('/');
      return;
    }
    fetchInterviews();
  }, [role, navigate]);

  const fetchInterviews = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await _interviewService.getCandidateInterviews();
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
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ONLINE': return <Video className="w-5 h-5" />;
      case 'OFFLINE': return <MapPin className="w-5 h-5" />;
      case 'PHONE': return <Phone className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const upcomingInterviews = interviews.filter(interview => 
    new Date(interview.scheduledAt) > new Date() && 
    interview.status !== 'CANCELLED' && 
    interview.status !== 'COMPLETED'
  );

  const pastInterviews = interviews.filter(interview => 
    new Date(interview.scheduledAt) <= new Date() || 
    interview.status === 'CANCELLED' || 
    interview.status === 'COMPLETED'
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your schedule...</p>
        </div>
      </div>
    );
  }

  if (role !== 'jobseeker') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/')} 
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
        </Button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Schedule</h1>
            <p className="text-gray-600">Manage your upcoming and past interviews</p>
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

      {/* Upcoming Interviews */}
      {upcomingInterviews.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-6 h-6 mr-2 text-blue-600" />
              Upcoming Interviews ({upcomingInterviews.length})
            </h2>
            <div className="space-y-4">
              {upcomingInterviews.map((interview) => {
                const { date, time } = formatDateTime(interview.scheduledAt);
                return (
                  <div key={interview.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {interview.jobTitle}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(interview.status)}`}>
                            {interview.status}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">at {interview.companyName}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {getTypeIcon(interview.type)}
                            <span className="capitalize">{interview.type.toLowerCase()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{interview.duration} minutes</span>
                          </div>
                        </div>
                        {interview.location && (
                          <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{interview.location}</span>
                          </div>
                        )}
                        {interview.meetingLink && (
                          <div className="mt-2">
                            <a
                              href={interview.meetingLink.startsWith('http') ? interview.meetingLink : `https://${interview.meetingLink}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm underline"
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

                        {/* Interview Decision Info for Upcoming */}
                        {(interview.status === 'SELECTED' || interview.status === 'REJECTED') && (
                          <div className={`mt-3 p-3 rounded-md border-l-4 ${
                            interview.status === 'SELECTED' 
                              ? 'bg-green-50 border-green-400' 
                              : 'bg-red-50 border-red-400'
                          }`}>
                            <div className="flex items-start gap-2">
                              {interview.status === 'SELECTED' ? (
                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <div className={`font-medium text-sm ${
                                  interview.status === 'SELECTED' ? 'text-green-800' : 'text-red-800'
                                }`}>
                                  Interview Result: <span className="capitalize">{interview.status.toLowerCase()}</span>
                                </div>
                                {interview.decisionReason && (
                                  <div className="mt-1 text-sm text-gray-700">
                                    <strong>Reason:</strong> {interview.decisionReason}
                                  </div>
                                )}
                                {interview.feedback && (
                                  <div className="mt-1 text-sm text-gray-700">
                                    <strong>Feedback:</strong> {interview.feedback}
                                  </div>
                                )}
                                {interview.decidedAt && (
                                  <div className="mt-1 text-xs text-gray-500">
                                    Decision made: {new Date(interview.decidedAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past Interviews */}
      {pastInterviews.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-6 h-6 mr-2 text-gray-600" />
              Past Interviews ({pastInterviews.length})
            </h2>
            <div className="space-y-4">
              {pastInterviews.map((interview) => {
                const { date, time } = formatDateTime(interview.scheduledAt);
                return (
                  <div key={interview.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-700">
                            {interview.jobTitle}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(interview.status)}`}>
                            {interview.status}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-2">at {interview.companyName}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {getTypeIcon(interview.type)}
                            <span className="capitalize">{interview.type.toLowerCase()}</span>
                          </div>
                        </div>
                        {interview.location && (
                          <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>{interview.location}</span>
                          </div>
                        )}
                        {interview.meetingLink && (
                          <div className="mt-2">
                            <a
                              href={interview.meetingLink.startsWith('http') ? interview.meetingLink : `https://${interview.meetingLink}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm underline"
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

                        {/* Interview Decision Info */}
                        {(interview.status === 'SELECTED' || interview.status === 'REJECTED') && (
                          <div className={`mt-3 p-3 rounded-md border-l-4 ${
                            interview.status === 'SELECTED' 
                              ? 'bg-green-50 border-green-400' 
                              : 'bg-red-50 border-red-400'
                          }`}>
                            <div className="flex items-start gap-2">
                              {interview.status === 'SELECTED' ? (
                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                              ) : (
                                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                              )}
                              <div className="flex-1">
                                <div className={`font-medium text-sm ${
                                  interview.status === 'SELECTED' ? 'text-green-800' : 'text-red-800'
                                }`}>
                                  Interview Result: <span className="capitalize">{interview.status.toLowerCase()}</span>
                                </div>
                                {interview.decisionReason && (
                                  <div className="mt-1 text-sm text-gray-700">
                                    <strong>Reason:</strong> {interview.decisionReason}
                                  </div>
                                )}
                                {interview.feedback && (
                                  <div className="mt-1 text-sm text-gray-700">
                                    <strong>Feedback:</strong> {interview.feedback}
                                  </div>
                                )}
                                {interview.decidedAt && (
                                  <div className="mt-1 text-xs text-gray-500">
                                    Decision made: {new Date(interview.decidedAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {interviews.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No interviews scheduled</h3>
            <p className="text-gray-600">
              You don't have any interviews scheduled yet. Keep applying to jobs to get interview opportunities!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MySchedule;
