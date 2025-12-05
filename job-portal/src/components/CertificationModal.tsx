import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, Building, Award, FileText, Link, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import ConfirmationModal from './ConfirmationModal';

interface Certification {
    id: string;
    name: string;
    issuer: string;
    issue_date: string;
    expiry_date?: string;
    credential_id?: string;
    credential_url?: string;
    description?: string;
    certificate_file?: string;
}

interface CertificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (certification: Omit<Certification, 'id'>) => Promise<void>;
    onDelete?: (certificationId: string) => void;
    onRefresh?: () => void;
    certification?: Certification | null;
    isEditing?: boolean;
}

const CertificationModal: React.FC<CertificationModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    onRefresh,
    certification = null,
    isEditing = false
}) => {
    const [formData, setFormData] = useState({
        name: certification?.name || '',
        issuer: certification?.issuer || '',
        issue_date: certification?.issue_date || '',
        expiry_date: certification?.expiry_date || '',
        credential_id: certification?.credential_id || '',
        credential_url: certification?.credential_url || '',
        description: certification?.description || ''
    });

    const [isLoading, setIsLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Update form data when certification prop changes
    useEffect(() => {
        setFormData({
            name: certification?.name || '',
            issuer: certification?.issuer || '',
            issue_date: certification?.issue_date || '',
            expiry_date: certification?.expiry_date || '',
            credential_id: certification?.credential_id || '',
            credential_url: certification?.credential_url || '',
            description: certification?.description || ''
        });
    }, [certification]);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    // Clean up empty fields and ensure proper typing
    const cleanedData: Omit<Certification, 'id'> = {
      name: formData.name.trim(),
      issuer: formData.issuer.trim(),
      issue_date: formData.issue_date,
      ...(formData.expiry_date && formData.expiry_date.trim() && { expiry_date: formData.expiry_date.trim() }),
      ...(formData.credential_id && formData.credential_id.trim() && { credential_id: formData.credential_id.trim() }),
      ...(formData.credential_url && formData.credential_url.trim() && { credential_url: formData.credential_url.trim() }),
      ...(formData.description && formData.description.trim() && { description: formData.description.trim() })
    };

    await onSave(cleanedData);
    // Success toast is handled in UserProfile.tsx, but we can add one here too for immediate feedback
    if (isEditing) {
      toast.success('Certification updated successfully!');
    } else {
      toast.success('Certification added successfully!');
    }
    onClose();
  } catch (error) {
    toast.error('Failed to save certification');
  } finally {
    setIsLoading(false);
  }
};

const handleDelete = async () => {
  if (!certification || !isEditing || !onDelete) return;

  setIsLoading(true);
  try {
    onDelete(certification.id);
    onClose();
    setShowDeleteConfirm(false);
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Failed to delete certification');
  } finally {
    setIsLoading(false);
  }
};

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
                        {isEditing ? 'Edit Certification' : 'Add Certification'}
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
                                Certification Name *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., AWS Certified Solutions Architect"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Issuer *
                            </label>
                            <input
                                type="text"
                                name="issuer"
                                value={formData.issuer}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., Amazon Web Services"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Issue Date *
                            </label>
                            <input
                                type="date"
                                name="issue_date"
                                value={formData.issue_date}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expiry Date
                            </label>
                            <input
                                type="date"
                                name="expiry_date"
                                value={formData.expiry_date}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Credential ID
                            </label>
                            <input
                                type="text"
                                name="credential_id"
                                value={formData.credential_id}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., AWS-CSA-123456"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Credential URL
                            </label>
                            <input
                                type="url"
                                name="credential_url"
                                value={formData.credential_url}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="https://aws.amazon.com/verification/..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Additional details about the certification..."
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
                                        {isEditing ? 'Update' : 'Add'} Certification
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
                title="Delete Certification"
                message="Are you sure you want to delete this certification? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
                loading={isLoading}
            />
        </div>
    );
};

export default CertificationModal;