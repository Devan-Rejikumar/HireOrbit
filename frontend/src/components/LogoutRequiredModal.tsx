import React from 'react';
import { X, LogOut, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/button';

interface LogoutRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LogoutRequiredModal: React.FC<LogoutRequiredModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { logout, role } = useAuth();

  if (!isOpen) return null;

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      // Redirect to register page with company role pre-selected
      navigate(`${ROUTES.REGISTER}?role=company`);
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, still redirect to register
      onClose();
      navigate(`${ROUTES.REGISTER}?role=company`);
    }
  };

  const getRoleDisplayName = () => {
    if (role === 'jobseeker') return 'job seeker';
    if (role === 'admin') return 'admin';
    return 'user';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Logout Required</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Account Switch Required
              </h3>
              <p className="text-gray-600 leading-relaxed">
                You are currently logged in as a <span className="font-semibold text-gray-900">{getRoleDisplayName()}</span>. 
                To register as a company and post jobs, you need to logout from your current account first.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> After logging out, you'll be redirected to the registration page where you can create a company account.
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleLogout}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout and Register</span>
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutRequiredModal;


