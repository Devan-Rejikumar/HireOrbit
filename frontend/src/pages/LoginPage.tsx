// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import LoginForm from '../components/LoginForm';

const LoginPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'jobseeker' | 'company'>('jobseeker');

  const getRoleContent = () => {
    if (selectedRole === 'jobseeker') {
      return {
        title: 'Welcome Back',
        subtitle: 'Continue your career journey and discover amazing opportunities',
        features: [
          'Access your personalized job recommendations',
          'Track your application status',
          'Connect with recruiters and hiring managers',
          'Update your profile and skills',
        ],
      };
    } else {
      return {
        title: 'Company Dashboard',
        subtitle: 'Manage your hiring process and find the best talent',
        features: [
          'View and manage job postings',
          'Review candidate applications',
          'Schedule and conduct interviews',
          'Track hiring metrics and analytics',
        ],
      };
    }
  };

  const content = getRoleContent();

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-hidden">
      {/* Left Column - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-100 relative overflow-hidden">
        {/* Abstract Shapes - exactly like Fintechdb */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-pink-300 rounded-full -translate-y-24 translate-x-24 opacity-60"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-800 rounded-full -translate-y-16 translate-x-16 opacity-80"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-pink-300 rounded-full translate-y-20 translate-x-20 opacity-60"></div>
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-teal-400 rounded-full -translate-x-28 translate-y-28 opacity-70"></div>
        
        {/* Logo and Branding */}
        <div className="flex flex-col items-center justify-center w-full relative z-10 px-8">
          <div className="flex items-center justify-center mb-8">
            {/* Logo - three blue rectangles and one teal circle */}
            <div className="flex items-center space-x-1">
              <div className="w-8 h-3 bg-blue-800 rounded-full"></div>
              <div className="w-6 h-3 bg-blue-800 rounded-full"></div>
              <div className="w-4 h-3 bg-blue-800 rounded-full"></div>
              <div className="w-3 h-3 bg-teal-400 rounded-full ml-2"></div>
            </div>
            <span className="ml-3 text-2xl font-bold text-blue-800">HireOrbit</span>
          </div>
          
          {/* Dynamic Content */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-blue-800 mb-3">{content.title}</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-6 font-bold">{content.subtitle}</p>
            
            {/* Feature List */}
            <div className="space-y-3 flex flex-col items-center">
              {content.features.map((feature, index) => (
                <div key={index} className="text-gray-700">
                  <span className="text-sm text-center">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Bottom Navigation */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-6 text-sm text-gray-500">
          <a href="#" className="hover:text-gray-700 transition-colors">About</a>
          <a href="#" className="hover:text-gray-700 transition-colors">Privacy</a>
          <a href="#" className="hover:text-gray-700 transition-colors">Terms of use</a>
          <a href="#" className="hover:text-gray-700 transition-colors">FAQ</a>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-md py-4">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center items-center mb-8">
            <div className="flex items-center justify-center space-x-1">
              <div className="w-8 h-3 bg-blue-800 rounded-full"></div>
              <div className="w-6 h-3 bg-blue-800 rounded-full"></div>
              <div className="w-4 h-3 bg-blue-800 rounded-full"></div>
              <div className="w-3 h-3 bg-teal-400 rounded-full ml-2"></div>
              <span className="ml-2 text-xl font-bold text-gray-800">HireOrbit</span>
            </div>
          </div>
          <LoginForm onRoleChange={setSelectedRole} />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;