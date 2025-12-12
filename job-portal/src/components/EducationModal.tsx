import React, { useEffect, useState } from 'react';
import { X, Save, Calendar } from 'lucide-react';
import api from '../api/axios';
import ConfirmationModal from './ConfirmationModal';
import toast from 'react-hot-toast';

interface EducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  education?: {
    id: string;
    institution: string;
    degree: string;
    startDate: string;
    endDate?: string;
  };
  isEdit?: boolean;
}

const EducationModal: React.FC<EducationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  education,
  isEdit = false,
}) => {
  const [formData, setFormData] = useState({
    institution: '',
    degree: '',
    startDate: '',
    endDate: '',
    isCurrentlyStudying: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEdit && education) {
        setFormData({
          institution: education.institution || '',
          degree: education.degree || '',
          startDate: education.startDate
            ? education.startDate.split('T')[0]
            : '',
          endDate: education.endDate ? education.endDate.split('T')[0] : '',
          isCurrentlyStudying: !education.endDate && !!education,
        });
      } else {
        // Add mode - reset to empty form
        setFormData({
          institution: '',
          degree: '',
          startDate: '',
          endDate: '',
          isCurrentlyStudying: false,
        });
      }
      setError(''); // Clear any previous errors
    }
  }, [isOpen, isEdit, education]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
        // Clear end date if currently studying is checked
        ...(name === 'isCurrentlyStudying' && checked ? { endDate: '' } : {}),
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
      !formData.institution.trim() ||
      !formData.degree.trim() ||
      !formData.startDate
    ) {
      setError('Institution, Degree, and Start Date are required');
      setLoading(false);
      return;
    }

    if (!formData.isCurrentlyStudying && !formData.endDate) {
      setError('End Date is required unless you are currently studying');
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
      const educationData = {
        institution: formData.institution.trim(),
        degree: formData.degree.trim(),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: formData.isCurrentlyStudying
          ? undefined
          : new Date(formData.endDate).toISOString(),
      };

      if (isEdit && education) {
        await api.put(`/profile/education/${education.id}`, educationData);
        toast.success('Education updated successfully!');
      } else {
        await api.post('/profile/education', educationData);
        toast.success('Education added successfully!');
      }

      onSave();
      onClose();
    } catch (error: unknown) {
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const axiosError = isAxiosError ? (error as { response?: { data?: { error?: string } } }) : null;
      const errorMessage = axiosError?.response?.data?.error || 'Failed to save education';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleDelete = async () => {
    if (!education || !isEdit) return;

    setLoading(true);
    setError('');

    try {
      await api.delete(`/profile/education/${education.id}`);
      toast.success('Education deleted successfully!');
      onSave();
      onClose();
      setShowDeleteConfirm(false);
    } catch (error: unknown) {
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const axiosError = isAxiosError ? (error as { response?: { data?: { error?: string } } }) : null;
      const errorMessage = axiosError?.response?.data?.error || 'Failed to delete education';
      setError(errorMessage);
      toast.error(errorMessage);
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
            {isEdit ? 'Edit Education' : 'Add Education'}
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

          {/* Institution */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Institution *
            </label>
            <input
              type="text"
              name="institution"
              value={formData.institution}
              onChange={handleInputChange}
              placeholder="e.g. Harvard University"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Degree */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Degree *
            </label>
            <input
              type="text"
              name="degree"
              value={formData.degree}
              onChange={handleInputChange}
              placeholder="e.g. Bachelor of Science in Computer Science"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Currently Studying Checkbox */}
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="isCurrentlyStudying"
                checked={formData.isCurrentlyStudying}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                I am currently studying here
              </span>
            </label>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4 mb-6">
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
                End Date {!formData.isCurrentlyStudying && '*'}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  disabled={formData.isCurrentlyStudying}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required={!formData.isCurrentlyStudying}
                />
              </div>
            </div>
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
                Delete Education
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
                    {isEdit ? 'Update Education' : 'Add Education'}
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
        title="Delete Education"
        message="Are you sure you want to delete this education? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={loading}
      />
    </div>
  );
};

export default EducationModal;
