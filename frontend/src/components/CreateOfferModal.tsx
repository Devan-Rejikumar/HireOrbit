import React, { useState } from 'react';
import { X, FileText, DollarSign, Calendar, MapPin, MessageSquare } from 'lucide-react';
import { offerService, CreateOfferInput } from '@/api/offerService';
import toast from 'react-hot-toast';

interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  onSuccess: () => void;
}

interface FormData {
  jobTitle: string;
  ctc: string;
  joiningDate: string;
  location: string;
  offerMessage: string;
  offerExpiryDate: string;
}

const CreateOfferModal: React.FC<CreateOfferModalProps> = ({
  isOpen,
  onClose,
  applicationId,
  candidateName,
  jobTitle,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<FormData>({
    jobTitle: jobTitle,
    ctc: '',
    joiningDate: '',
    location: '',
    offerMessage: '',
    offerExpiryDate: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.jobTitle.trim()) {
      setError('Job title is required');
      return false;
    }

    if (!formData.ctc || parseFloat(formData.ctc) <= 0) {
      setError('Valid CTC (Cost to Company) is required');
      return false;
    }

    if (!formData.joiningDate) {
      setError('Joining date is required');
      return false;
    }

    if (!formData.location.trim()) {
      setError('Location is required');
      return false;
    }

    if (!formData.offerExpiryDate) {
      setError('Offer expiry date is required');
      return false;
    }

    const joiningDate = new Date(formData.joiningDate);
    const expiryDate = new Date(formData.offerExpiryDate);
    const now = new Date();

    if (expiryDate <= joiningDate) {
      setError('Offer expiry date must be after joining date');
      return false;
    }

    if (expiryDate <= now) {
      setError('Offer expiry date must be in the future');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setError('');

      const offerData: CreateOfferInput = {
        jobTitle: formData.jobTitle.trim(),
        ctc: parseFloat(formData.ctc),
        joiningDate: new Date(formData.joiningDate).toISOString(),
        location: formData.location.trim(),
        offerMessage: formData.offerMessage.trim() || undefined,
        offerExpiryDate: new Date(formData.offerExpiryDate).toISOString(),
      };

      await offerService.createOffer(applicationId, offerData);
      
      toast.success('Offer letter created and sent successfully!');
      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        jobTitle: jobTitle,
        ctc: '',
        joiningDate: '',
        location: '',
        offerMessage: '',
        offerExpiryDate: '',
      });
    } catch (err: unknown) {
      console.error('Failed to create offer:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create offer letter';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];
  // Default expiry date: 30 days from today
  const defaultExpiryDate = new Date();
  defaultExpiryDate.setDate(defaultExpiryDate.getDate() + 30);
  const defaultExpiryDateStr = defaultExpiryDate.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Create Offer Letter</h2>
              <p className="text-sm text-gray-500 mt-1">for {candidateName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              disabled={submitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Job Title */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4" />
                <span>Job Title *</span>
              </label>
              <input
                type="text"
                value={formData.jobTitle}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Senior Software Engineer"
                required
              />
            </div>

            {/* CTC and Location Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CTC */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4" />
                  <span>CTC (₹) *</span>
                </label>
                <input
                  type="number"
                  value={formData.ctc}
                  onChange={(e) => handleInputChange('ctc', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 1200000"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              {/* Location */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>Location *</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Bangalore, India"
                  required
                />
              </div>
            </div>

            {/* Joining Date and Expiry Date Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Joining Date */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>Joining Date *</span>
                </label>
                <input
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => handleInputChange('joiningDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min={today}
                  required
                />
              </div>

              {/* Offer Expiry Date */}
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>Offer Expiry Date *</span>
                </label>
                <input
                  type="date"
                  value={formData.offerExpiryDate || defaultExpiryDateStr}
                  onChange={(e) => handleInputChange('offerExpiryDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min={formData.joiningDate || today}
                  required
                />
              </div>
            </div>

            {/* Offer Message */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="w-4 h-4" />
                <span>Offer Message (Optional)</span>
              </label>
              <textarea
                value={formData.offerMessage}
                onChange={(e) => handleInputChange('offerMessage', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Additional terms, benefits, or information about the offer..."
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Create Offer Letter</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateOfferModal;

