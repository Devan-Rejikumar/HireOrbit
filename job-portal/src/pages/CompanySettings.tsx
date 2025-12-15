import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Home,
  MessageSquare,
  User,
  Users,
  GraduationCap,
  Clock,
  CreditCard,
  HelpCircle,
  Bell,
  Settings,
  LogOut,
  Building2,
  Plus,
  ArrowLeft,
  Calendar as CalendarIcon,
  Save,
  Upload,
  Mail,
  Phone,
  MapPin,
  Globe,
} from 'lucide-react';
import EditCompanyProfileModal from '@/components/EditCompanyProfileModal';
import api from '@/api/axios';

interface Company {
  id: string;
  companyName: string;
  email: string;
  industry?: string;
  size?: string;
  isVerified: boolean;
  profileCompleted?: boolean;
  jobCount?: number;
  rejectionReason?: string;
  website?: string;
  phone?: string;
  address?: string;
  description?: string;
  logo?: string;
}

const CompanySettings = () => {
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  useEffect(() => {
    fetchCompanyProfile();
  }, []);

  const fetchCompanyProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ 
        success?: boolean; 
        data?: { company?: Company }; 
        company?: Company;
      }>('/company/profile');
      let companyData: Company | null = null;
      
      if (response.data && response.data.success && response.data.data && response.data.data.company) {
        companyData = response.data.data.company;
      } else if (response.data && response.data.company) {
        companyData = response.data.company;
      }
      
      setCompany(companyData);
    } catch (error) {
      console.error('Error fetching company profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyProfileClick = () => {
    setIsEditProfileModalOpen(true);
  };

  const handleLogout = async () => {
    navigate(ROUTES.LOGIN, { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-700">Loading settings...</h3>
          <p className="text-gray-500">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            {/* Hire Orbit Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Hire Orbit</span>
            </div>
            
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
                <span className="font-bold text-purple-700">{company?.companyName || 'Company'}</span>
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

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm border-r border-gray-200 relative">
          <nav className="p-6">
            <div className="space-y-1 mb-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Main</h3>
              <button 
                onClick={() => navigate(ROUTES.COMPANY_DASHBOARD)}
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
              >
                <Home className="h-5 w-5" />
                Dashboard
              </button>
              <button className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
                <MessageSquare className="h-5 w-5" />
                Messages
              </button>
              <button 
                onClick={() => navigate(ROUTES.COMPANY_DASHBOARD)}
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
              >
                <Building2 className="h-5 w-5" />
                Company Profile
              </button>
              <button className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left">
                <User className="h-5 w-5" />
                All Applicants
              </button>
              <button 
                onClick={() => navigate(ROUTES.COMPANY_JOBS)}
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
              >
                <GraduationCap className="h-5 w-5" />
                Job Listing
              </button>
              <button 
                onClick={() => navigate(ROUTES.COMPANY_INTERVIEWS)}
                className="flex items-start gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
              >
                <CalendarIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span className="flex flex-col leading-tight">
                  <span>Interview</span>
                  <span>Management</span>
                </span>
              </button>
              <button 
                onClick={() => navigate(ROUTES.SUBSCRIPTIONS)}
                className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg w-full text-left"
              >
                <CreditCard className="h-5 w-5" />
                Plans & Billing
              </button>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Setting</h3>
              <button className="flex items-center gap-3 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg font-medium w-full text-left">
                <Settings className="h-5 w-5" />
                Settings
              </button>
              <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                <HelpCircle className="h-5 w-5" />
                Help Center
              </a>
            </div>
          </nav>
          
          <div className="absolute bottom-6 left-6 right-6">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {company?.logo ? (
                <img 
                  src={company.logo} 
                  alt={company.companyName || 'Company logo'} 
                  className="w-8 h-8 rounded-full object-cover border-2 border-purple-200"
                />
              ) : (
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-purple-600" />
                </div>
              )}
              <div>
                <div className="text-sm font-medium">{company?.companyName || 'Company'}</div>
                <div className="text-xs text-gray-500">{company?.email || 'email@company.com'}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Settings className="h-8 w-8 text-purple-600" />
                  Company Settings
                </h1>
              </div>
              <p className="text-gray-600">Manage your company information, preferences, and account settings.</p>
            </div>

            {/* Settings Sections */}
            <div className="space-y-6">
              
              {/* Company Profile Section */}
              <Card>
                  <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Building2 className="h-6 w-6 text-purple-600" />
                    Company Profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Company Logo Display */}
                  {company?.logo && (
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Company Logo</label>
                      <div className="flex items-center gap-4">
                        <img 
                          src={company.logo} 
                          alt={company.companyName || 'Company logo'} 
                          className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200"
                        />
                        <div>
                          <p className="text-sm text-gray-600">Your company logo is displayed across the platform</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Company Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Company Name</label>
                          <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                            <Building2 className="h-4 w-4 inline mr-2 text-gray-500" />
                            {company?.companyName || 'Not provided'}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Email</label>
                          <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                            <Mail className="h-4 w-4 inline mr-2 text-gray-500" />
                            {company?.email || 'Not provided'}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Industry</label>
                          <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                            <GraduationCap className="h-4 w-4 inline mr-2 text-gray-500" />
                            {company?.industry || 'Not specified'}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Company Size</label>
                          <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                            <Users className="h-4 w-4 inline mr-2 text-gray-500" />
                            {company?.size || 'Not specified'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Website</label>
                          <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                            <Globe className="h-4 w-4 inline mr-2 text-gray-500" />
                            {company?.website || 'Not provided'}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Phone</label>
                          <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                            <Phone className="h-4 w-4 inline mr-2 text-gray-500" />
                            {company?.phone || 'Not provided'}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Address</label>
                          <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                            <MapPin className="h-4 w-4 inline mr-2 text-gray-500" />
                            {company?.address || 'Not provided'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Update Profile Information</h4>
                        <p className="text-sm text-gray-600">Manage your company profile details and contact information.</p>
                      </div>
                      <Button 
                        onClick={handleCompanyProfileClick}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Building2 className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Status Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Bell className="h-6 w-6 text-blue-600" />
                    Account Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                        company?.profileCompleted ? 'bg-green-100' : 'bg-yellow-100'
                      }`}>
                        <Building2 className={`h-4 w-4 ${
                          company?.profileCompleted ? 'text-green-600' : 'text-yellow-600'
                        }`} />
                      </div>
                      <h4 className="font-medium text-gray-900">Profile Status</h4>
                      <p className="text-sm text-gray-600">
                        {company?.profileCompleted ? 'Completed' : 'Incomplete'}
                      </p>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 ${
                        company?.isVerified ? 'bg-green-100' : 'bg-yellow-100'
                      }`}>
                        <Bell className={`h-4 w-4 ${
                          company?.isVerified ? 'text-green-600' : 'text-yellow-600'
                        }`} />
                      </div>
                      <h4 className="font-medium text-gray-900">Verification</h4>
                      <p className="text-sm text-gray-600">
                        {company?.isVerified ? 'Verified' : 'Pending'}
                      </p>
                    </div>
                    
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <GraduationCap className="h-4 w-4 text-blue-600" />
                      </div>
                      <h4 className="font-medium text-gray-900">Jobs Posted</h4>
                      <p className="text-sm text-gray-600">{company?.jobCount || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preferences Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Settings className="h-6 w-6 text-purple-600" />
                    Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Save Your Preferences</h4>
                      <p className="text-sm text-gray-600">Save your company settings and preferences.</p>
                    </div>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Save className="h-4 w-4 mr-2" />
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <EditCompanyProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        company={company}
        onProfileUpdated={() => {
          setIsEditProfileModalOpen(false);
          fetchCompanyProfile(); // Refresh data
        }}
      />
    </div>
  );
};

export default CompanySettings;
