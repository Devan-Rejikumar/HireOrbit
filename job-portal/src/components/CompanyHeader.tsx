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
  const { settings } = useBranding();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      navigate(ROUTES.LOGIN, { replace: true });
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 fixed top-0 left-0 right-0 z-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Company Logo */}
          <Logo size="md" textClassName="text-gray-900" iconClassName="bg-gradient-to-br from-purple-600 to-indigo-600" fallbackIcon="letter" />
          
          {/* Company Info */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Company</span>
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
              {company?.logo ? (
                <img 
                  src={company.logo} 
                  alt={company.companyName || 'Company logo'} 
                  className="w-6 h-6 rounded object-cover"
                />
              ) : (
                <Building2 className="h-4 w-4 text-gray-500" />
              )}
              <span className="font-medium">{company?.companyName || 'Company'}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Post Job Button */}
          <div className="flex items-center gap-2">
            <Button 
              className={`px-4 py-2 ${
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
              <Plus className="h-4 w-4 mr-2" />
              Post a job
            </Button>
            
            {/* Notification message when button is disabled */}
            {(!company?.profileCompleted || !company?.isVerified) && (
              <div className="flex items-center gap-2">
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
            <Bell className="h-6 w-6 text-gray-600 hover:text-gray-900 cursor-pointer" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
          </div>
          
          {/* Logout Button */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleLogout}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

