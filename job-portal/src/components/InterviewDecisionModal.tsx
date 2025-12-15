import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { InterviewDecisionData, InterviewWithDetails } from '@/api/interviewService';
import toast from 'react-hot-toast';

interface InterviewDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  interview: InterviewWithDetails | null;
  decision: 'SELECTED' | 'REJECTED' | null;
  onSuccess: (decisionData: InterviewDecisionData) => void;
}

const InterviewDecisionModal: React.FC<InterviewDecisionModalProps> = ({
  isOpen,
  onClose,
  interview,
  decision,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    decisionReason: '',
    feedback: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        decisionReason: '',
        feedback: '',
      });
    }
  }, [isOpen]);

  if (!isOpen || !interview || !decision) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.decisionReason.trim().length < 10) {
      toast.error('Please provide a detailed reason (at least 10 characters)');
      return;
    }

    setLoading(true);
    
    const decisionData: InterviewDecisionData = {
      status: decision,
      decisionReason: formData.decisionReason.trim(),
      feedback: formData.feedback.trim() || undefined,
    };

    onSuccess(decisionData);
    setLoading(false);
  };

  const isConfirmingSelection = decision === 'SELECTED';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          isConfirmingSelection ? 'border-green-200' : 'border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            {isConfirmingSelection ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600" />
            )}
            <h2 className="text-xl font-semibold text-gray-900">
              {isConfirmingSelection ? 'Select Candidate' : 'Reject Candidate'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Interview Info */}
        <div className="p-6 border-b bg-gray-50">
          <div className="text-sm text-gray-600 mb-2">
            <strong>Interview Details:</strong>
          </div>
          <div className="space-y-1 text-sm">
            <div><strong>Candidate:</strong> {interview.candidateName}</div>
            <div><strong>Job:</strong> {interview.jobTitle}</div>
            <div><strong>Company:</strong> {interview.companyName}</div>
            <div><strong>Scheduled:</strong> {new Date(interview.scheduledAt).toLocaleString()}</div>
            <div><strong>Type:</strong> {interview.type.toLowerCase()}</div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Decision Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason for {isConfirmingSelection ? 'Selection' : 'Rejection'} *
            </label>
            <textarea
              id="reason"
              value={formData.decisionReason}
              onChange={(e) => setFormData(prev => ({ ...prev, decisionReason: e.target.value }))}
              placeholder={`Please provide a detailed reason for ${isConfirmingSelection ? 'selecting' : 'rejecting'} this candidate...`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={4}
              required
              disabled={loading}
            />
            <div className="text-xs text-gray-500 mt-1">
              Minimum 10 characters required
            </div>
          </div>

          {/* Feedback */}
          <div>
            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
              Additional Feedback (Optional)
            </label>
            <textarea
              id="feedback"
              value={formData.feedback}
              onChange={(e) => setFormData(prev => ({ ...prev, feedback: e.target.value }))}
              placeholder="Any additional feedback for the candidate..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || formData.decisionReason.trim().length < 10}
              className={`flex-1 px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 ${
                isConfirmingSelection
                  ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-300'
                  : 'bg-red-600 hover:bg-red-700 disabled:bg-red-300'
              }`}
            >
              {loading ? 'Processing...' : `${isConfirmingSelection ? 'Select' : 'Reject'} Candidate`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterviewDecisionModal;
