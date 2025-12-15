import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Lock, Eye, EyeOff } from 'lucide-react';
import { userService } from '../api/userService';
import toast from 'react-hot-toast';
import { ROUTES } from '../constants/routes';
import { MESSAGES } from '@/constants/messages';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validateForm = () => {
    console.log('🔍 [Validation] Starting validation with data:', formData);

    if (!formData.currentPassword) {
      console.log('❌ [Validation] Current password is missing');
      toast.error(MESSAGES.VALIDATION.CURRENT_PASSWORD_REQUIRED);
      return false;
    }
    if (!formData.newPassword) {
      console.log('❌ [Validation] New password is missing');
      toast.error(MESSAGES.VALIDATION.NEW_PASSWORD_REQUIRED);
      return false;
    }
    if (formData.newPassword.length < 8) {
      console.log('❌ [Validation] New password too short:', formData.newPassword.length);
      toast.error(MESSAGES.VALIDATION.PASSWORD_MIN_LENGTH);
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.newPassword)) {
      console.log('❌ [Validation] New password does not meet complexity requirements');
      toast.error(MESSAGES.VALIDATION.PASSWORD_COMPLEXITY);
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      console.log('❌ [Validation] Passwords do not match:', {
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      toast.error(MESSAGES.VALIDATION.PASSWORD_MISMATCH);
      return false;
    }
    if (formData.currentPassword === formData.newPassword) {
      console.log('❌ [Validation] New password same as current password');
      toast.error(MESSAGES.VALIDATION.PASSWORD_SAME_AS_CURRENT);
      return false;
    }
    console.log('✅ [Validation] All validations passed!');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Form submitted with data:', formData);
    console.log('🚀 Event:', e);
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }

    console.log('✅ Form validation passed, calling API...');
    setIsLoading(true);
    try {
      console.log('📞 Calling userService.changePassword...');
      const result = await userService.changePassword(formData.currentPassword, formData.newPassword);
      console.log('✅ Change password API response:', result);
      
      toast.success(`${MESSAGES.SUCCESS.PASSWORD_CHANGED} ${MESSAGES.SUCCESS.LOGIN_REQUIRED}`);
      
      // Clear form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Close modal
      onClose();
      
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = ROUTES.LOGIN;
      }, 2000);
      
    } catch (error: unknown) {
      console.error(' Error changing password:', error);
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const axiosError = isAxiosError ? (error as { message?: string; response?: { data?: unknown; status?: number } }) : null;
      console.error(' Error details:', {
        message: axiosError?.message,
        response: axiosError?.response?.data,
        status: axiosError?.response?.status,
      });
      const errorMessage = axiosError?.response?.data && typeof axiosError.response.data === 'object' && 'message' in axiosError.response.data
        ? (axiosError.response.data as { message?: string }).message
        : undefined;
      toast.error(errorMessage || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed top-0 left-0 right-0 bottom-0 bg-black bg-opacity-50" 
      style={{ 
        zIndex: 9999999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      <div 
        className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out overflow-y-auto" 
        style={{ 
          zIndex: 10000000,
          position: 'fixed',
          top: 0,
          right: 0,
          height: '100vh',
          width: '24rem',
        }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <Lock className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
              Must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
              Cancel
              </button>
              <button
                type="button"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={(e) => {
                  console.log('🔥 Save Password button clicked!');
                  console.log('🔥 Form data:', formData);
                  console.log('🔥 Is loading:', isLoading);
                  console.log('🔥 Event:', e);
                  // Manually trigger form submission
                  handleSubmit(e as React.FormEvent<HTMLButtonElement>);
                }}
              >
                {isLoading ? 'Saving...' : 'Save Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ChangePasswordModal;
