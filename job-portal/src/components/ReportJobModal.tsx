import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/api/axios';

interface ReportJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  onReportSuccess?: () => void;
}

const ReportJobModal: React.FC<ReportJobModalProps> = ({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  onReportSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setError('Please provide a reason for reporting this job');
      return;
    }

    if (reason.trim().length < 10) {
      setError('Reason must be at least 10 characters');
      return;
    }

    if (reason.trim().length > 500) {
      setError('Reason must not exceed 500 characters');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await api.post(`/jobs/${jobId}/report`, {
        reason: reason.trim(),
      });

      toast.success('Job reported successfully. Thank you for your feedback!');
      setReason('');
      onClose();
      if (onReportSuccess) {
        onReportSuccess();
      }
    } catch (err: any) {
      console.error('Failed to report job', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to report job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setReason('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Report Job</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Please provide a reason for reporting <span className="font-semibold">"{jobTitle}"</span>
        </p>

        {error && (
          <div className="mb-4 px-4 py-2 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
              placeholder="Please describe why you are reporting this job (e.g., misleading information, spam, inappropriate content, etc.)"
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              maxLength={500}
              disabled={loading}
            />
            <div className="mt-1 text-xs text-gray-500 text-right">
              {reason.length}/500 characters
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !reason.trim() || reason.trim().length < 10}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Reporting...
                </>
              ) : (
                'Report Job'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportJobModal;

