import React, { useEffect, useState } from 'react';
import api from '@/api/axios';
import { FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

interface IndustryCategory {
  id: string;
  name: string;
  isActive: boolean;
}

const AdminIndustryCategories: React.FC = () => {
  const [categories, setCategories] = useState<IndustryCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [editingCategory, setEditingCategory] = useState<IndustryCategory | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<IndustryCategory | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<{ data: { categories: IndustryCategory[] } }>('/company/admin/industries?includeInactive=true');
      const apiCategories: IndustryCategory[] = response.data?.data?.categories || [];
      setCategories(apiCategories);
    } catch (err: unknown) {
      const isAxiosError = err && typeof err === 'object' && 'response' in err;
      const axiosError = isAxiosError ? (err as { response?: { data?: { error?: string; message?: string } } }) : null;
      setError(axiosError?.response?.data?.error || axiosError?.response?.data?.message || 'Failed to load industry categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const resetForm = () => {
    setName('');
    setEditingCategory(null);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      setError(null);

      if (editingCategory) {
        await api.put(`/company/admin/industries/${editingCategory.id}`, {
          name: name.trim(),
        });
        toast.success('Industry category updated successfully');
      } else {
        await api.post('/company/admin/industries', {
          name: name.trim(),
        });
        toast.success('Industry category created successfully');
      }

      resetForm();
      await loadCategories();
    } catch (err: unknown) {
      const isAxiosError = err && typeof err === 'object' && 'response' in err;
      const axiosError = isAxiosError ? (err as { response?: { data?: { error?: string; message?: string } } }) : null;
      setError(axiosError?.response?.data?.error || axiosError?.response?.data?.message || 'Failed to save industry category');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: IndustryCategory) => {
    setEditingCategory(category);
    setName(category.name);
  };

  const openDeleteModal = (category: IndustryCategory) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCategoryToDelete(null);
    setDeleteLoading(false);
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      setDeleteLoading(true);
      setError(null);
      await api.delete(`/company/admin/industries/${categoryToDelete.id}`);
      toast.success(`Industry category "${categoryToDelete.name}" deleted successfully`);
      closeDeleteModal();
      await loadCategories();
    } catch (err: unknown) {
      const isAxiosError = err && typeof err === 'object' && 'response' in err;
      const axiosError = isAxiosError ? (err as { response?: { data?: { error?: string; message?: string } } }) : null;
      setError(axiosError?.response?.data?.error || axiosError?.response?.data?.message || 'Failed to delete industry category');
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleActive = async (category: IndustryCategory) => {
    try {
      setLoading(true);
      setError(null);
      await api.put(`/company/admin/industries/${category.id}`, {
        isActive: !category.isActive,
      });
      await loadCategories();
    } catch (err: unknown) {
      const isAxiosError = err && typeof err === 'object' && 'response' in err;
      const axiosError = isAxiosError ? (err as { response?: { data?: { error?: string; message?: string } } }) : null;
      setError(axiosError?.response?.data?.error || axiosError?.response?.data?.message || 'Failed to update industry category status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Industry Category Management</h1>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-purple-500/20">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FiPlus className="text-purple-400" />
          {editingCategory ? 'Edit Industry Category' : 'Add New Industry Category'}
        </h2>

        {error && (
          <div className="mb-4 px-4 py-2 rounded-md bg-red-900/40 border border-red-500 text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateOrUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Industry Category Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Technology"
              className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              maxLength={100}
            />
          </div>
          <div className="flex gap-3">
            {editingCategory && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-md border border-gray-600 text-gray-200 hover:bg-gray-700 flex items-center gap-2"
                disabled={loading}
              >
                <FiX />
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
            >
              <FiPlus />
              {editingCategory ? 'Update Category' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-purple-500/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">All Industry Categories</h2>
          {loading && (
            <span className="text-xs text-gray-400">Loading...</span>
          )}
        </div>

        {categories.length === 0 ? (
          <p className="text-gray-400 text-sm">No industry categories found. Add your first category above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-300">
              <thead className="bg-gray-900 text-gray-400">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-t border-gray-700 hover:bg-gray-900/60">
                    <td className="px-4 py-2">{category.name}</td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => toggleActive(category)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          category.isActive
                            ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                            : 'bg-gray-700 text-gray-300 border border-gray-600'
                        }`}
                      >
                        {category.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(category)}
                        className="inline-flex items-center px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-xs"
                      >
                        <FiEdit2 className="mr-1" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteModal(category)}
                        className="inline-flex items-center px-3 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 text-xs"
                      >
                        <FiTrash2 className="mr-1" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && categoryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-900 rounded-full flex items-center justify-center">
                <FiTrash2 className="h-6 w-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">Delete Industry Category</h3>
                <p className="text-sm text-gray-400 mt-1">This action cannot be undone</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-300">
                Are you sure you want to delete <span className="font-semibold text-white">&quot;{categoryToDelete.name}&quot;</span>?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2 className="h-4 w-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIndustryCategories;

