import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import api from '../api/axios';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.put('/profile', { skills });
      onSave();
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update skills');
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

          {/* Add New Skill */}
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
