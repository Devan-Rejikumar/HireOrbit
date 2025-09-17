import React, { useEffect, useState } from 'react';
import { X, Save, Calendar } from 'lucide-react';
import api from '../api/axios';
import ConfirmationModal from './ConfirmationModal';

interface ExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  experience?: {
    id: string;
    title: string;
    company: string;
    location?: string;
    startDate: string;
    endDate?: string;
    description?: string;
    isCurrentRole: boolean;
  };
  isEdit?: boolean;
}

const ExperienceModal: React.FC<ExperienceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  experience,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    startDate: '',
    endDate: '',
    description: '',
    isCurrentRole: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEdit && experience) {
        // Edit mode - populate with existing data
        setFormData({
          title: experience.title || '',
          company: experience.company || '',
          location: experience.location || '',
          startDate: experience.startDate
            ? experience.startDate.split('T')[0]
            : '',
          endDate: experience.endDate ? experience.endDate.split('T')[0] : '',
          description: experience.description || '',
          isCurrentRole: experience.isCurrentRole || false,
        });
      } else {
        // Add mode - reset to empty form
        setFormData({
          title: '',
          company: '',
          location: '',
          startDate: '',
          endDate: '',
          description: '',
          isCurrentRole: false,
        });
      }
      setError(''); // Clear any previous errors
    }
  }, [isOpen, isEdit, experience]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
        // Clear end date if current role is checked
        ...(name === 'isCurrentRole' && checked ? { endDate: '' } : {}),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (
      !formData.title.trim() ||
      !formData.company.trim() ||
      !formData.startDate
    ) {
      setError('Title, Company, and Start Date are required');
      setLoading(false);
      return;
    }

    if (!formData.isCurrentRole && !formData.endDate) {
      setError('End Date is required unless this is your current role');
      setLoading(false);
      return;
    }

    if (
      formData.endDate &&
      new Date(formData.endDate) < new Date(formData.startDate)
    ) {
      setError('End Date cannot be before Start Date');
      setLoading(false);
      return;
    }

    try {
      const experienceData = {
        title: formData.title.trim(),
        company: formData.company.trim(),
        location: formData.location.trim() || undefined,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.isCurrentRole
          ? undefined
          : new Date(formData.endDate).toISOString(),
        description: formData.description.trim() || undefined,
        isCurrentRole: formData.isCurrentRole,
      };

      if (isEdit && experience) {
        await api.put(`/profile/experience/${experience.id}`, experienceData);
      } else {
        await api.post('/profile/experience', experienceData);
      }

      onSave();
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to save experience');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (!experience || !isEdit) return;

    setLoading(true);
    setError('');

    try {
      await api.delete(`/profile/experience/${experience.id}`);
      onSave();
      onClose();
      setShowDeleteConfirm(false);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to delete experience');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Edit Experience' : 'Add Experience'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Job Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g. Software Engineer"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Company */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company *
            </label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              placeholder="e.g. Google"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Location */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g. New York, NY"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Current Role Checkbox */}
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isCurrentRole"
                checked={formData.isCurrentRole}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                I currently work here
              </span>
            </label>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date {!formData.isCurrentRole && '*'}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  disabled={formData.isCurrentRole}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required={!formData.isCurrentRole}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your responsibilities, achievements, and key projects..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/1000 characters
            </p>
          </div>

          {/* Buttons */}
          {/* Buttons */}
          <div className="flex justify-between pt-4 border-t">
            {/* Delete button (only show in edit mode) */}
            {isEdit && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                disabled={loading}
              >
                Delete Experience
              </button>
            )}

            {/* Right side buttons */}
            <div className={`flex gap-3 ${!isEdit ? 'ml-auto' : ''}`}>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {isEdit ? 'Update Experience' : 'Add Experience'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
      {/* Add this before the final closing </div> */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Experience"
        message="Are you sure you want to delete this experience? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={loading}
      />
    </div>
  );
};

export default ExperienceModal;
