import React, { useEffect, useState } from 'react';
import api from '@/api/axios';
import { FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi';

interface Skill {
  id: string;
  name: string;
  category?: string | null;
  isActive: boolean;
}

const AdminSkills: React.FC = () => {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<Skill | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadSkills = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<{ data: { skills: Skill[] } }>('/skills?includeInactive=true');
      const apiSkills: Skill[] = response.data?.data?.skills || [];
      setSkills(apiSkills);
    } catch (err: any) {
      console.error('Failed to load skills', err);
      setError(err.response?.data?.error || 'Failed to load skills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const resetForm = () => {
    setName('');
    setCategory('');
    setEditingSkill(null);
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      setError(null);

      if (editingSkill) {
        await api.put(`/skills/${editingSkill.id}`, {
          name: name.trim(),
          category: category.trim() || undefined,
        });
      } else {
        await api.post('/skills', {
          name: name.trim(),
          category: category.trim() || undefined,
        });
      }

      resetForm();
      await loadSkills();
    } catch (err: any) {
      console.error('Failed to save skill', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to save skill');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (skill: Skill) => {
    setEditingSkill(skill);
    setName(skill.name);
    setCategory(skill.category || '');
  };

  const openDeleteModal = (skill: Skill) => {
    setSkillToDelete(skill);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSkillToDelete(null);
  };

  const handleDelete = async () => {
    if (!skillToDelete) return;
    
    try {
      setDeleteLoading(true);
      setError(null);
      await api.delete(`/skills/${skillToDelete.id}`);
      await loadSkills();
      closeDeleteModal();
    } catch (err: any) {
      console.error('Failed to delete skill', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to delete skill');
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleActive = async (skill: Skill) => {
    try {
      setLoading(true);
      setError(null);
      await api.put(`/skills/${skill.id}`, {
        isActive: !skill.isActive,
      });
      await loadSkills();
    } catch (err: any) {
      console.error('Failed to update skill status', err);
      setError(err.response?.data?.error || 'Failed to update skill status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Skill Management</h1>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-purple-500/20">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FiPlus className="text-purple-400" />
          {editingSkill ? 'Edit Skill' : 'Add New Skill'}
        </h2>

        {error && (
          <div className="mb-4 px-4 py-2 rounded-md bg-red-900/40 border border-red-500 text-red-200 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateOrUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Skill Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. JavaScript"
              className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              maxLength={100}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Category (optional)</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Programming Language"
              className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              maxLength={100}
            />
          </div>
          <div className="flex gap-3">
            {editingSkill && (
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
              {editingSkill ? 'Update Skill' : 'Add Skill'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-purple-500/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">All Skills</h2>
          {loading && (
            <span className="text-xs text-gray-400">Loading...</span>
          )}
        </div>

        {skills.length === 0 ? (
          <p className="text-gray-400 text-sm">No skills found. Add your first skill above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-300">
              <thead className="bg-gray-900 text-gray-400">
                <tr>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2">Category</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {skills.map((skill) => (
                  <tr key={skill.id} className="border-t border-gray-700 hover:bg-gray-900/60">
                    <td className="px-4 py-2">{skill.name}</td>
                    <td className="px-4 py-2 text-gray-400">
                      {skill.category || '-'}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => toggleActive(skill)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          skill.isActive
                            ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                            : 'bg-gray-700 text-gray-300 border border-gray-600'
                        }`}
                      >
                        {skill.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-2 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(skill)}
                        className="inline-flex items-center px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-xs"
                      >
                        <FiEdit2 className="mr-1" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => openDeleteModal(skill)}
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
      {showDeleteModal && skillToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Delete Skill
              </h3>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete the skill <strong>"{skillToDelete.name}"</strong>? 
                This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeDeleteModal}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deleteLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FiTrash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSkills;


