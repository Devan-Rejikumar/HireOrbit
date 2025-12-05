import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, CheckCircle, XCircle, Building2, Mail, Phone, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/api/axios';

interface CompanyProfile {
  id: string;
  companyName: string;
  email: string;
  industry?: string;
  size?: string;
  website?: string;
  description?: string;
  headquarters?: string;
  phone?: string;
  businessType?: string;
  contactPersonName?: string;
  contactPersonTitle?: string;
  contactPersonEmail?: string;
  isVerified: boolean;
  rejectionReason?: string;
  profileCompleted: boolean;
}

interface ProfileStep {
  profileCompleted: boolean;
  currentStep: number;
}

interface ProfileResponse {
  success: boolean;
  data: {
    company: CompanyProfile;
    profileStep?: ProfileStep | null | undefined;
  };
  company?: CompanyProfile;
  profileStep?: ProfileStep | null | undefined;
  message: string;
  timestamp: string;
}

const CompanyReviewStatus = () => {
  const navigate = useNavigate();
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reapplying, setReapplying] = useState(false);

  useEffect(() => {
    console.log('🔄 CompanyReviewStatus: Component mounted, fetching profile...');
    fetchCompanyProfile();
  }, []);

  const fetchCompanyProfile = async () => {
    console.log('🚀 CompanyReviewStatus: Starting fetchCompanyProfile...');
    try {
      console.log('📡 CompanyReviewStatus: Making API call to /company/profile');
      console.log('🍪 CompanyReviewStatus: Current cookies:', document.cookie);
      
      const response = await api.get<ProfileResponse>('/company/profile');
      
      console.log('✅ CompanyReviewStatus: API call successful');
      console.log('📊 CompanyReviewStatus: Response status:', response.status);
      console.log('📋 CompanyReviewStatus: Full response:', response);
      console.log('📋 CompanyReviewStatus: Response data:', response.data);
      
      // Check if response has the expected structure
      if (response.data && response.data.success && response.data.data && response.data.data.company) {
        console.log('✅ CompanyReviewStatus: Valid response structure found');
        setCompany(response.data.data.company);
        console.log('🏢 CompanyReviewStatus: Company data set:', response.data.data.company);
      } else {
        console.error('❌ CompanyReviewStatus: Invalid response structure');
        console.error('❌ CompanyReviewStatus: Expected structure: { success: true, data: { company: {...} } }');
        console.error('❌ CompanyReviewStatus: Actual structure:', response.data);
        setError('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('❌ CompanyReviewStatus: Error fetching company profile');
      console.error('❌ CompanyReviewStatus: Error details:', error);
      console.error('❌ CompanyReviewStatus: Error response:', error.response);
      console.error('❌ CompanyReviewStatus: Error status:', error.response?.status);
      console.error('❌ CompanyReviewStatus: Error data:', error.response?.data);
      
      if (error.response?.status === 401) {
        setError('Authentication required. Please login again.');
      } else if (error.response?.status === 404) {
        setError('Company profile not found. Please complete your profile setup.');
      } else if (error.response?.data?.error) {
        setError(`Server error: ${error.response.data.error}`);
      } else {
        setError('Failed to load company profile. Please try again.');
      }
    } finally {
      console.log('🏁 CompanyReviewStatus: fetchCompanyProfile completed');
      setLoading(false);
    }
  };

  const handleReapply = async () => {
    if (!company?.id) {
      console.error('❌ No company ID available for reapply');
      toast.error('No company ID available for reapply');
      return;
    }

    try {
      setReapplying(true);
      console.log('🔄 CompanyReviewStatus: Starting reapply process for company:', company.id);
      
      // Call the reapply API endpoint
      const response = await api.post('/company/reapply');
      
      console.log('✅ CompanyReviewStatus: Reapply API call successful');
      console.log('📊 CompanyReviewStatus: Reapply response:', response.data);
      
      // Show success message
      toast.success('Reapplication initiated successfully! You can now update your profile.');
      
      // Navigate to profile setup to complete the reapplication
      console.log('🚀 CompanyReviewStatus: Navigating to profile setup for reapplication');
      navigate('/company/profile-setup');
      
    } catch (error: any) {
      console.error('❌ CompanyReviewStatus: Error during reapply');
      console.error('❌ CompanyReviewStatus: Error details:', error);
      console.error('❌ CompanyReviewStatus: Error response:', error.response);
      console.error('❌ CompanyReviewStatus: Error status:', error.response?.status);
      console.error('❌ CompanyReviewStatus: Error data:', error.response?.data);
      
      const errorMessage = error.response?.data?.error || 'Failed to initiate reapplication. Please try again.';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setReapplying(false);
    }
  };

  const getStatusInfo = () => {
    console.log('🔍 CompanyReviewStatus: getStatusInfo called with company:', company);
    
    if (!company) {
      console.log('❌ CompanyReviewStatus: No company data available');
      return null;
    }

    console.log('📊 CompanyReviewStatus: Company status check:');
    console.log('  - profileCompleted:', company.profileCompleted);
    console.log('  - isVerified:', company.isVerified);
    console.log('  - rejectionReason:', company.rejectionReason);

    if (!company.profileCompleted) {
      console.log('🟡 CompanyReviewStatus: Status = INCOMPLETE');
      return {
        status: 'incomplete',
        icon: <Clock className="h-8 w-8 text-yellow-500" />,
        title: 'Profile Incomplete',
        message: 'Please complete your company profile to submit for review.',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800',
      };
    }

    if (company.rejectionReason) {
      console.log('🔴 CompanyReviewStatus: Status = REJECTED');
      return {
        status: 'rejected',
        icon: <XCircle className="h-8 w-8 text-red-500" />,
        title: 'Application Rejected',
        message: 'Your company application has been rejected. Please review the feedback and reapply.',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800',
      };
    }

    if (company.isVerified) {
      console.log('🟢 CompanyReviewStatus: Status = APPROVED');
      return {
        status: 'approved',
        icon: <CheckCircle className="h-8 w-8 text-green-500" />,
        title: 'Company Approved!',
        message: 'Congratulations! Your company has been approved and you can now post jobs.',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-800',
      };
    }

    console.log('🔵 CompanyReviewStatus: Status = PENDING');
    return {
      status: 'pending',
      icon: <Clock className="h-8 w-8 text-blue-500" />,
      title: 'Under Review',
      message: 'Your company profile is currently being reviewed by our admin team. This usually takes 1-2 business days.',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
    };
  };

  console.log('🎨 CompanyReviewStatus: Rendering component');
  console.log('🎨 CompanyReviewStatus: Loading state:', loading);
  console.log('🎨 CompanyReviewStatus: Error state:', error);
  console.log('🎨 CompanyReviewStatus: Company state:', company);

  if (loading) {
    console.log('⏳ CompanyReviewStatus: Showing loading state');
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your company status...</p>
        </div>
      </div>
    );
  }

  if (error || !company) {
    console.log('❌ CompanyReviewStatus: Showing error state');
    console.log('❌ CompanyReviewStatus: Error:', error);
    console.log('❌ CompanyReviewStatus: Company:', company);
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Profile</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <Button onClick={() => navigate('/company/profile-setup')} className="w-full">
                Go to Profile Setup
              </Button>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()} 
                className="w-full"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo();
  console.log('📊 CompanyReviewStatus: Status info:', statusInfo);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Building2 className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Company Review Status</h1>
          <p className="text-gray-600">Welcome back, {company.companyName}</p>
        </div>

        {/* Status Card */}
        {statusInfo && (
          <Card className={`mb-8 ${statusInfo.borderColor} border-2`}>
            <CardContent className={`p-6 ${statusInfo.bgColor}`}>
              <div className="flex items-center mb-4">
                {statusInfo.icon}
                <div className="ml-4">
                  <h2 className={`text-xl font-semibold ${statusInfo.textColor}`}>
                    {statusInfo.title}
                  </h2>
                  <p className={`${statusInfo.textColor} opacity-90`}>
                    {statusInfo.message}
                  </p>
                </div>
              </div>

              {/* Rejection Reason */}
              {company.rejectionReason && (
                <Alert className="mt-4 border-red-300 bg-red-50">
                  <AlertDescription className="text-red-800">
                    <strong>Rejection Reason:</strong> {company.rejectionReason}
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                {statusInfo.status === 'incomplete' && (
                  <Button 
                    onClick={() => navigate('/company/profile-setup')}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Complete Profile
                  </Button>
                )}
                
                {statusInfo.status === 'rejected' && (
                  <Button 
                    onClick={handleReapply}
                    disabled={reapplying}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                  >
                    {reapplying ? 'Processing...' : 'Update & Reapply'}
                  </Button>
                )}
                
                {statusInfo.status === 'approved' && (
                  <Button 
                    onClick={() => navigate('/company/dashboard')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Go to Dashboard
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Company Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Basic Information</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Company Name:</strong> {company.companyName}</div>
                  <div><strong>Industry:</strong> {company.industry || 'Not specified'}</div>
                  <div><strong>Size:</strong> {company.size || 'Not specified'}</div>
                  <div><strong>Business Type:</strong> {company.businessType || 'Not specified'}</div>
                  {company.website && (
                    <div><strong>Website:</strong> 
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                        {company.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-gray-500" />
                    {company.email}
                  </div>
                  {company.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-gray-500" />
                      {company.phone}
                    </div>
                  )}
                  {company.headquarters && (
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                      {company.headquarters}
                    </div>
                  )}
                  {company.contactPersonName && (
                    <div><strong>Contact Person:</strong> {company.contactPersonName} ({company.contactPersonTitle})</div>
                  )}
                </div>
              </div>
            </div>

            {company.description && (
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-2">About Company</h3>
                <p className="text-gray-700 text-sm leading-relaxed">{company.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => navigate('/company/profile-setup')}
            className="mr-4"
          >
            Edit Profile
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/login')}
          >
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CompanyReviewStatus;
