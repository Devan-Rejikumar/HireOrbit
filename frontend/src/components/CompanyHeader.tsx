import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Building2, Plus, Bell, LogOut } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { Logo } from './Logo';

interface CompanyProfile {
  companyName?: string;
  email?: string;
  profileCompleted?: boolean;
  isVerified?: boolean;
  logo?: string;
}

interface CompanyHeaderProps {
  company: CompanyProfile | null;
  onLogout?: () => void;
}

export const CompanyHeader: React.FC<CompanyHeaderProps> = ({ company, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      navigate(ROUTES.LOGIN, { replace: true });
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-3 sm:px-4 md:px-6 py-2 md:py-4 fixed top-0 left-0 right-0 z-20">
      <div className="flex items-center justify-between gap-2 md:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 md:gap-8 min-w-0 flex-1">
          {/* Company Logo */}
          <div className="flex-shrink-0 transform scale-90 sm:scale-100 origin-left">
            <Logo size="md" textClassName="text-gray-900" iconClassName="bg-gradient-to-br from-purple-600 to-indigo-600" fallbackIcon="letter" />
          </div>
          
          {/* Company Info */}
          <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
            <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">Company</span>
            <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg min-w-0">
              {company?.logo ? (
                <img 
                  src={company.logo} 
                  alt={company.companyName || 'Company logo'} 
                  className="w-5 h-5 sm:w-6 sm:h-6 rounded object-cover flex-shrink-0"
                />
              ) : (
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 flex-shrink-0" />
              )}
              <span className="font-medium text-xs sm:text-sm md:text-base truncate">{company?.companyName || 'Company'}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 flex-shrink-0">
          {/* Post Job Button */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Button 
              className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm ${
                company?.profileCompleted && company?.isVerified
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
              onClick={() => {
                if (company?.profileCompleted && company?.isVerified) {
                  navigate(ROUTES.COMPANY_POST_JOB);
                }
              }}
              disabled={!company?.profileCompleted || !company?.isVerified}
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
              <span className="hidden sm:inline">Post a job</span>
            </Button>
            
            {/* Notification message when button is disabled - Hidden on mobile */}
            {(!company?.profileCompleted || !company?.isVerified) && (
              <div className="hidden lg:flex items-center gap-2">
                <div className="text-xs text-gray-500 max-w-xs">
                  {!company?.profileCompleted 
                    ? 'Complete your profile to post jobs'
                    : !company?.isVerified 
                      ? 'Awaiting admin approval to post jobs'
                      : 'Complete profile and get approval to post jobs'
                  }
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(ROUTES.COMPANY_REVIEW_STATUS)}
                  className="text-xs px-2 py-1 border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  Check Status
                </Button>
              </div>
            )}
          </div>
          
          {/* Notification Bell */}
          <div className="relative">
            <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600 hover:text-gray-900 cursor-pointer" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
          </div>
          
          {/* Logout Button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLogout}
            className="border-gray-300 text-gray-700 hover:bg-gray-50 px-2 sm:px-3 py-1.5 sm:py-2"
          >
            <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

