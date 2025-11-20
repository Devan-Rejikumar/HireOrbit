import React from 'react';
import { AlertCircle, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const BlockedUser = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('role');
    // Clear all cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Account Blocked
          </h1>
          <p className="text-gray-600 mb-6">
            You have been blocked by the admin. Please contact support care for assistance.
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-800">
            If you believe this is an error, please reach out to our support team.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-center gap-3 text-gray-700">
            <Mail className="w-5 h-5" />
            <span className="text-sm">support@hireorbit.com</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-gray-700">
            <Phone className="w-5 h-5" />
            <span className="text-sm">+1 (555) 123-4567</span>
          </div>
        </div>

        <Button
          onClick={handleLogout}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        >
          Return to Login
        </Button>
      </div>
    </div>
  );
};

export default BlockedUser;

