import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Video } from 'lucide-react';
import { interviewService, UpdateInterviewData, InterviewWithDetails } from '@/api/interviewService';
import { toast } from 'react-toastify';

interface EditInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: InterviewWithDetails | null;
  onSuccess: (interviewId: string, updateData: UpdateInterviewData) => void;
}

interface FormData {
  scheduledAt: string;
  duration: number;
  type: 'ONLINE' | 'OFFLINE' | 'PHONE';
  location: string;
  meetingLink: string;
  notes: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
}

const EditInterviewModal: React.FC<EditInterviewModalProps> = ({
  isOpen,
  onClose,
  interview,
  onSuccess
}) => {
  const [formData, setFormData] = useState<FormData>({
    scheduledAt: '',
    duration: 60,
    type: 'ONLINE',
    location: '',
    meetingLink: '',
    notes: '',
    status: 'PENDING'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (interview && isOpen) {
      const scheduledDate = new Date(interview.scheduledAt);
      const localDateTime = new Date(scheduledDate.getTime() - scheduledDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      
      setFormData({
        scheduledAt: localDateTime,
        duration: interview.duration,
        type: interview.type,
        location: interview.location || '',
        meetingLink: interview.meetingLink || '',
        notes: interview.notes || '',
        status: interview.status as any
      });
      setError('');
    }
  }, [interview, isOpen]);

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.scheduledAt) {
      setError('Please select a date and time');
      return false;
    }

    if (formData.type === 'OFFLINE' && !formData.location.trim()) {
      setError('Location is required for offline interviews');
      return false;
    }

    if (formData.type === 'ONLINE' && !formData.meetingLink.trim()) {
      setError('Meeting link is required for online interviews');
      return false;
    }

    const selectedDate = new Date(formData.scheduledAt);
    const now = new Date();
    if (selectedDate <= now) {
      setError('Interview must be scheduled for a future time');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!interview || !validateForm()) return;

    try {
      setSubmitting(true);
      setError('');

      const updateData: UpdateInterviewData = {
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        duration: formData.duration,
        type: formData.type,
        location: formData.type === 'OFFLINE' ? formData.location : undefined,
        meetingLink: formData.type === 'ONLINE' ? formData.meetingLink : undefined,
        notes: formData.notes || undefined,
        status: formData.status
      };

      await onSuccess(interview.id, updateData);
      onClose();
    } catch (err: any) {
      console.error('Failed to update interview:', err);
      setError(err.response?.data?.message || 'Failed to update interview. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
    }
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); 
    return now.toISOString().slice(0, 16);
  };

  if (!isOpen || !interview) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edit Interview</h2>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Interview Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Interview Details</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Candidate:</strong> {interview.candidateName}</p>
                <p><strong>Job:</strong> {interview.jobTitle} at {interview.companyName}</p>
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e) => handleInputChange('scheduledAt', e.target.value)}
                  min={getMinDateTime()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Duration (minutes)
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            </div>

            {/* Interview Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Interview Type</label>
              <div className="space-y-2">
                {[
                  { value: 'ONLINE', icon: Video, label: 'Online' },
                  { value: 'OFFLINE', icon: MapPin, label: 'In-Person' },
                  { value: 'PHONE', icon: Clock, label: 'Phone' }
                ].map(({ value, icon: Icon, label }) => (
                  <label key={value} className="flex items-center">
                    <input
                      type="radio"
                      name="type"
                      value={value}
                      checked={formData.type === value}
                      onChange={(e) => handleInputChange('type', e.target.value as any)}
                      className="mr-3"
                    />
                    <Icon className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Location (for offline) */}
            {formData.type === 'OFFLINE' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter interview location"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            {/* Meeting Link (for online) */}
            {formData.type === 'ONLINE' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Video className="inline h-4 w-4 mr-1" />
                  Meeting Link
                </label>
                <input
                  type="url"
                  value={formData.meetingLink}
                  onChange={(e) => handleInputChange('meetingLink', e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes for the candidate..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              Update Interview
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditInterviewModal;
