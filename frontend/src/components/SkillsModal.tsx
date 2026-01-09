import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

interface SkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  currentSkills: string[];
}

const SkillsModal: React.FC<SkillsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentSkills,
}) => {
  const [skills, setSkills] = useState<string[]>([...currentSkills]);
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchSkills = async () => {
      try {
        setLoadingSuggestions(true);
        interface SkillsResponse {
          success: boolean;
          data: {
            skills: Array<{ name: string }>;
          };
          message?: string;
        }
        const response = await api.get<SkillsResponse>('/skills');
        const apiSkills: string[] =
          response.data?.data?.skills?.map((s) => s.name) || [];
        setAvailableSkills(apiSkills);
      } catch (err: unknown) {
        // silently ignore, user can still type custom skills
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSkills();
  }, [isOpen]);

  const addSkill = () => {
    const trimmedSkill = newSkill.trim();
    if (trimmedSkill && !skills.includes(trimmedSkill)) {
      setSkills([...skills, trimmedSkill]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const addSuggestedSkill = (skillName: string) => {
    if (!skills.includes(skillName)) {
      setSkills([...skills, skillName]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.put('/profile', { skills });
      toast.success('Skills updated successfully!');
      onSave();
      onClose();
    } catch (error: unknown) {
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const axiosError = isAxiosError ? (error as { response?: { data?: { error?: string } } }) : null;
      const errorMessage = axiosError?.response?.data?.error || 'Failed to update skills';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Manage Skills</h2>
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

          {/* Suggested Skills from Admin */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Suggested Skills (from admin)
              </label>
              {loadingSuggestions && (
                <span className="text-xs text-gray-400">Loading...</span>
              )}
            </div>
            {availableSkills.length === 0 ? (
              <p className="text-xs text-gray-400">
                No suggested skills yet. You can still type your own skills below.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                {availableSkills.map((skill) => (
                  <button
                    type="button"
                    key={skill}
                    onClick={() => addSuggestedSkill(skill)}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                      skills.includes(skill)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add New Skill (custom or from suggestions) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add New Skill
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g. JavaScript, React, Node.js"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={50}
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Press Enter or click Add to add a skill
            </p>
          </div>

          {/* Current Skills */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Your Skills ({skills.length})
            </label>
            {skills.length === 0 ? (
              <p className="text-gray-500 text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                No skills added yet. Add your first skill above!
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {skills.map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-blue-50 text-blue-700 px-3 py-2 rounded-full"
                  >
                    <span className="font-medium">{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="text-blue-500 hover:text-red-500 transition-colors ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
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
                'Save Skills'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SkillsModal;
