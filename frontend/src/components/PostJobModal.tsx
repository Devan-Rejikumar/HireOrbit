import React from 'react';
import { X, Building2, User, ArrowRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PostJobModal: React.FC<PostJobModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleCompanyRegister = () => {
    onClose();
    navigate('/register');
  };

  const handleUserRegister = () => {
    onClose();
    navigate('/register');
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
            <h2 className="text-2xl font-bold text-gray-900">Post a Job</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Ready to Post Your Job?
              </h3>
              <p className="text-gray-600">
                To post jobs on HireOrbit, you need to register as a company. Choose your registration type below.
              </p>
            </div>

            {/* Registration Options */}
            <div className="space-y-4">
              {/* Company Registration - Recommended */}
              <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-4 relative">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-gray-900">Company Registration</h4>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        Recommended
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Perfect for businesses looking to hire talent
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Post unlimited job listings</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Manage applications</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Company profile page</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCompanyRegister}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <span>Register as Company</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* User Registration */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">Job Seeker Registration</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Looking for jobs? Register as a job seeker
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Apply to jobs</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Build your profile</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-700">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span>Get job recommendations</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleUserRegister}
                  className="w-full mt-4 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <span>Register as Job Seeker</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <button 
                  onClick={() => {onClose(); navigate('/login');}}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostJobModal;
