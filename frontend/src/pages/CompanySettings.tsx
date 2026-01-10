import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Home,
  MessageSquare,
  User,
  Users,
  GraduationCap,
  CreditCard,
  HelpCircle,
  Bell,
  Settings,
  LogOut,
  Building2,
  Plus,
  Calendar as CalendarIcon,
  Save,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  Palette,
  Type,
  Eye as EyeIcon,
  X,
} from 'lucide-react';
import EditCompanyProfileModal from '@/components/EditCompanyProfileModal';
import { Logo } from '@/components/Logo';
import api from '@/api/axios';
import { offerTemplateService, CompanyOfferTemplate, UpdateTemplateInput, PreviewOfferData } from '@/api/offerTemplateService';
import toast from 'react-hot-toast';

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
  const location = useLocation();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  
  // Template state
  const [template, setTemplate] = useState<CompanyOfferTemplate | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [templateForm, setTemplateForm] = useState<UpdateTemplateInput>({
    brandColor: null,
    fontFamily: null,
    headerText: null,
    introText: null,
    closingText: null,
    footerText: null,
  });
  const [useCustomLogo, setUseCustomLogo] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchCompanyProfile();
    fetchTemplate();
  }, [location.pathname]);

  const fetchTemplate = async () => {
    try {
      setTemplateLoading(true);
      const templateData = await offerTemplateService.getTemplate();
      if (templateData) {
        setTemplate(templateData);
        setTemplateForm({
          brandColor: templateData.brandColor,
          fontFamily: templateData.fontFamily,
          headerText: templateData.headerText,
          introText: templateData.introText,
          closingText: templateData.closingText,
          footerText: templateData.footerText,
        });
        setUseCustomLogo(!!templateData.logoUrl);
      }
    } catch (_error) {
      // Silently handle error
    } finally {
      setTemplateLoading(false);
    }
  };

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
    } catch (_error) {
      // Silently handle error
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

  const handleTemplateSave = async () => {
    try {
      setTemplateLoading(true);
      const updatedTemplate = await offerTemplateService.updateTemplate(templateForm);
      setTemplate(updatedTemplate);
      toast.success('Template saved successfully!');
    } catch (_error) {
      toast.error('Failed to save template. Please try again.');
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      setTemplateLoading(true);
      await offerTemplateService.uploadLogo(file);
      await fetchTemplate(); // Refresh template
      toast.success('Logo uploaded successfully!');
    } catch (_error) {
      toast.error('Failed to upload logo. Please try again.');
    } finally {
      setTemplateLoading(false);
    }
  };

  const handleSignatureUpload = async (file: File) => {
    try {
      setTemplateLoading(true);
      await offerTemplateService.uploadSignature(file);
      await fetchTemplate(); // Refresh template
      toast.success('Signature uploaded successfully!');
    } catch (_error) {
      toast.error('Failed to upload signature. Please try again.');
    } finally {
      setTemplateLoading(false);
    }
  };

  const handlePreview = async () => {
    try {
      setTemplateLoading(true);
      const previewData: PreviewOfferData = {
        jobTitle: 'Software Engineer',
        ctc: 1000000,
        joiningDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Remote',
        offerMessage: 'We are excited to have you join our team!',
        offerExpiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        candidateName: 'John Doe',
        companyName: company?.companyName || 'Your Company',
      };
      const blob = await offerTemplateService.previewTemplate(previewData);
      const url = URL.createObjectURL(blob);
      setPreviewPdfUrl(url);
      setShowPreview(true);
    } catch (_error) {
      toast.error('Failed to generate preview. Please try again.');
    } finally {
      setTemplateLoading(false);
    }
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
        <aside className="w-64 bg-white shadow-sm border-r border-gray-200 relative overflow-y-auto hide-scrollbar">
          <nav className="p-6">
            <div className="space-y-1 mb-8">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Main</h3>
              <button 
                onClick={() => navigate(ROUTES.COMPANY_DASHBOARD)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full text-left ${
                  location.pathname === ROUTES.COMPANY_DASHBOARD
                    ? 'bg-purple-50 text-purple-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Home className="h-5 w-5" />
                Dashboard
              </button>
              <button 
                onClick={() => navigate(ROUTES.CHAT)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full text-left ${
                  location.pathname === ROUTES.CHAT
                    ? 'bg-purple-50 text-purple-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <MessageSquare className="h-5 w-5" />
                Messages
              </button>
              <button 
                onClick={() => navigate(ROUTES.COMPANY_DASHBOARD)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full text-left ${
                  location.pathname === ROUTES.COMPANY_DASHBOARD
                    ? 'bg-purple-50 text-purple-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Building2 className="h-5 w-5" />
                Company Profile
              </button>
              <button 
                onClick={() => navigate(ROUTES.COMPANY_APPLICATIONS)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full text-left ${
                  location.pathname === ROUTES.COMPANY_APPLICATIONS
                    ? 'bg-purple-50 text-purple-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <User className="h-5 w-5" />
                All Applicants
              </button>
              <button 
                onClick={() => navigate(ROUTES.COMPANY_JOBS)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full text-left ${
                  location.pathname === ROUTES.COMPANY_JOBS
                    ? 'bg-purple-50 text-purple-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <GraduationCap className="h-5 w-5" />
                Job Listing
              </button>
              <button 
                onClick={() => navigate(ROUTES.COMPANY_INTERVIEWS)}
                className={`flex items-start gap-3 px-3 py-2 rounded-lg w-full text-left ${
                  location.pathname === ROUTES.COMPANY_INTERVIEWS
                    ? 'bg-purple-50 text-purple-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <CalendarIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span className="flex flex-col leading-tight">
                  <span>Interview</span>
                  <span>Management</span>
                </span>
              </button>
              <button 
                onClick={() => navigate(ROUTES.COMPANY_OFFERS)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full text-left ${
                  location.pathname === ROUTES.COMPANY_OFFERS
                    ? 'bg-purple-50 text-purple-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FileText className="h-5 w-5" />
                Offer Letters
              </button>
              <button 
                onClick={() => navigate(ROUTES.SUBSCRIPTIONS)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full text-left ${
                  location.pathname === ROUTES.SUBSCRIPTIONS
                    ? 'bg-purple-50 text-purple-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <CreditCard className="h-5 w-5" />
                Plans & Billing
              </button>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Setting</h3>
              <button 
                onClick={() => navigate(ROUTES.COMPANY_SETTINGS)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium w-full text-left ${
                  location.pathname === ROUTES.COMPANY_SETTINGS
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Settings className="h-5 w-5" />
                Settings
              </button>
              <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">
                <HelpCircle className="h-5 w-5" />
                Help Center
              </a>
            </div>
            
            {/* Company Info */}
            <div className="mt-8">
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
          </nav>
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

              {/* Offer Letter Template Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-purple-600" />
                    Offer Letter Template
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {templateLoading && !template ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading template...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Company Logo Display */}
                      <div className="border-b border-gray-200 pb-6">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Company Logo</label>
                        {company?.logo && (
                          <div className="flex items-center gap-4 mb-4">
                            <img 
                              src={company.logo} 
                              alt="Company logo" 
                              className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200"
                            />
                            <div>
                              <p className="text-sm text-gray-600">Using company profile logo</p>
                              <p className="text-xs text-gray-500 mt-1">This logo will be used in offer letters by default</p>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            id="useCustomLogo"
                            checked={useCustomLogo}
                            onChange={(e) => setUseCustomLogo(e.target.checked)}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor="useCustomLogo" className="text-sm text-gray-700">
                            Use different logo for offer letters
                          </label>
                        </div>
                        {useCustomLogo && (
                          <div className="mt-4">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleLogoUpload(file);
                              }}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                            />
                            {template?.logoUrl && (
                              <div className="mt-2">
                                <img src={template.logoUrl} alt="Custom logo" className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Signature Upload */}
                      <div className="border-b border-gray-200 pb-6">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Signature</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleSignatureUpload(file);
                          }}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                        />
                        {template?.signatureUrl && (
                          <div className="mt-4">
                            <img src={template.signatureUrl} alt="Signature" className="h-20 object-contain border-2 border-gray-200 rounded" />
                          </div>
                        )}
                      </div>

                      {/* Brand Color */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          Brand Color
                        </label>
                        <div className="flex items-center gap-4">
                          <input
                            type="color"
                            value={templateForm.brandColor || '#000000'}
                            onChange={(e) => setTemplateForm({ ...templateForm, brandColor: e.target.value })}
                            className="w-20 h-10 rounded border border-gray-300 cursor-pointer"
                          />
                          <input
                            type="text"
                            value={templateForm.brandColor || ''}
                            onChange={(e) => setTemplateForm({ ...templateForm, brandColor: e.target.value })}
                            placeholder="#000000"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      {/* Font Family */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                          <Type className="h-4 w-4" />
                          Font Family
                        </label>
                        <select
                          value={templateForm.fontFamily || 'Helvetica'}
                          onChange={(e) => setTemplateForm({ ...templateForm, fontFamily: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="Helvetica">Helvetica</option>
                          <option value="Times-Roman">Times-Roman</option>
                          <option value="Courier">Courier</option>
                          <option value="Symbol">Symbol</option>
                          <option value="ZapfDingbats">ZapfDingbats</option>
                        </select>
                      </div>

                      {/* Header Text */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Header Text</label>
                        <textarea
                          value={templateForm.headerText || ''}
                          onChange={(e) => setTemplateForm({ ...templateForm, headerText: e.target.value })}
                          placeholder="OFFER LETTER"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      {/* Introduction Text */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Introduction Text</label>
                        <textarea
                          value={templateForm.introText || ''}
                          onChange={(e) => setTemplateForm({ ...templateForm, introText: e.target.value })}
                          placeholder="We are pleased to extend an offer of employment..."
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      {/* Closing Text */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Closing Text</label>
                        <textarea
                          value={templateForm.closingText || ''}
                          onChange={(e) => setTemplateForm({ ...templateForm, closingText: e.target.value })}
                          placeholder="Best regards,"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      {/* Footer Text */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Footer Text</label>
                        <textarea
                          value={templateForm.footerText || ''}
                          onChange={(e) => setTemplateForm({ ...templateForm, footerText: e.target.value })}
                          placeholder="Company Name HR Team"
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                        <Button
                          onClick={handleTemplateSave}
                          disabled={templateLoading}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Template
                        </Button>
                        <Button
                          onClick={handlePreview}
                          disabled={templateLoading}
                          variant="outline"
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  )}
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

      {/* Preview Modal */}
      {showPreview && previewPdfUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Offer Letter Preview</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowPreview(false);
                  if (previewPdfUrl) {
                    URL.revokeObjectURL(previewPdfUrl);
                    setPreviewPdfUrl(null);
                  }
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <iframe
              src={previewPdfUrl}
              className="w-full h-[80vh] border border-gray-300 rounded"
              title="Offer Letter Preview"
            />
          </div>
        </div>
      )}

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
