import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, Award, FileText, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import ConfirmationModal from './ConfirmationModal';

interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  achievement_file?: string;
}

interface AchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (achievement: Omit<Achievement, 'id'>) => Promise<void>;
  onDelete?: (achievementId: string) => void;
  onRefresh?: () => void;
  achievement?: Achievement | null;
  isEditing?: boolean;
}

const AchievementModal: React.FC<AchievementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  onRefresh,
  achievement = null,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState({
    title: achievement?.title || '',
    description: achievement?.description || '',
    date: achievement?.date || '',
    category: achievement?.category || '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Update form data when achievement prop changes
  useEffect(() => {
    setFormData({
      title: achievement?.title || '',
      description: achievement?.description || '',
      date: achievement?.date || '',
      category: achievement?.category || '',
    });
  }, [achievement]);

  const categories = [
    'Work',
    'Academic',
    'Volunteer',
    'Sports',
    'Other',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const cleanedData: Omit<Achievement, 'id'> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: formData.date,
        category: formData.category.trim(),
      };

      await onSave(cleanedData);
      onClose();
    } catch (error) {
      toast.error('Failed to save achievement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!achievement || !isEditing || !onDelete) return;

    setIsLoading(true);
    try {
      onDelete(achievement.id);
      onClose();
      setShowDeleteConfirm(false);
    } catch (error: unknown) {
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const axiosError = isAxiosError ? (error as { response?: { data?: { error?: string } } }) : null;
      toast.error(axiosError?.response?.data?.error || 'Failed to delete achievement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Award className="h-5 w-5 mr-2" />
            {isEditing ? 'Edit Achievement' : 'Add Achievement'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Achievement Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Best Employee of the Year"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your achievement in detail..."
            />
          </div>

          <div className="flex justify-between pt-4">
            {isEditing && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors flex items-center"
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </button>
            )}
            <div className="flex space-x-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    {isEditing ? 'Update' : 'Add'} Achievement
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Achievement"
        message="Are you sure you want to delete this achievement? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={isLoading}
      />
    </div>
  );
};

export default AchievementModal;