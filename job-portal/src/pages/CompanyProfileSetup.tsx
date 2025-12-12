import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  AlertCircle,
  Building2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import api from '@/api/axios';

interface CompanyData {
  // Step 2 fields
  industry?: string;
  size?: string;
  website?: string;
  description?: string;
  logo?: string;
  foundedYear?: number;
  headquarters?: string;
  phone?: string;
  linkedinUrl?: string;
  businessType?: string;

  // Step 3 fields
  contactPersonName?: string;
  contactPersonTitle?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
}

interface ProfileStepResponse {
  success: boolean;
  data: {
    profileStep: string | null | {
      profileCompleted: boolean;
      currentStep: number;
      basicInfoCompleted: boolean;
      companyDetailsCompleted: boolean;
      contactInfoCompleted: boolean;
    };
  };
  message: string;
  timestamp: string;
}

const CompanyProfileSetup = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const hasCheckedProfile = useRef(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const [formData, setFormData] = useState<CompanyData>({
    industry: '',
    size: '',
    website: '',
    description: '',
    logo: '',
    foundedYear: undefined,
    headquarters: '',
    phone: '',
    linkedinUrl: '',
    businessType: '',
    contactPersonName: '',
    contactPersonTitle: '',
    contactPersonEmail: '',
    contactPersonPhone: '',
  });
  const [industryCategories, setIndustryCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  useEffect(() => {
    // Fetch industry categories
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await api.get<{ data: { categories: Array<{ id: string; name: string }> } }>('/industries');
        setIndustryCategories(response.data?.data?.categories || []);
      } catch (err) {
        console.error('Failed to load industry categories', err);
        // Fallback to empty array if API fails
        setIndustryCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<{
          data?: {
            company?: CompanyData;
          };
          company?: CompanyData;
        }>('/company/profile');
        const company = res.data?.data?.company || res.data?.company;
        if (company) {
          setFormData((prev) => ({
            ...prev,
            industry: company.industry || '',
            size: company.size || '',
            website: company.website || '',
            description: company.description || '',
            logo: company.logo || '',
            foundedYear: company.foundedYear || undefined,
            headquarters: company.headquarters || '',
            phone: company.phone || '',
            linkedinUrl: company.linkedinUrl || '',
            businessType: company.businessType || '',
            contactPersonName: company.contactPersonName || '',
            contactPersonTitle: company.contactPersonTitle || '',
            contactPersonEmail: company.contactPersonEmail || '',
            contactPersonPhone: company.contactPersonPhone || '',
          }));
        }
      } catch (err) {
        // keep silent for now; page still works without prefill
      }
    })();
  }, []);

  useEffect(() => {
    if (!hasCheckedProfile.current) {
      hasCheckedProfile.current = true;
      checkProfileStep();
    }
  }, [isNavigating]);

  const checkProfileStep = async () => {
    if(isNavigating) return;
    try {
      console.log('=== Frontend Debug ===');
      console.log('All cookies:', document.cookie);
      console.log('Making request to:', '/company/profile/step');
      const response = await api.get<ProfileStepResponse>(
        '/company/profile/step',
      );
      console.log('Profile step response:', response.data);
      console.log('Profile step data:', response.data.data);
      console.log('Profile step value:', response.data.data?.profileStep);
      console.log('Profile step type:', typeof response.data.data?.profileStep);
      const step = response.data.data?.profileStep;
      console.log('Current step',step);
      if (step === null || step === undefined) {
        console.log('Step is null/undefined, setting to step 2');
        setCurrentStep(2);
      } else if (typeof step === 'object') {
        console.log('Step is object:', step);
        // Check if it's a completed profile object
        if (step.profileCompleted) {
          console.log('Profile completed, redirecting to review status');
          setIsNavigating(true);
          navigate(ROUTES.COMPANY_REVIEW_STATUS, { replace: true });
          return;
        } else {
          console.log('Profile not completed, setting to step 2');
          setCurrentStep(2);
        }
      } else if (typeof step === 'string') {
        console.log('Step is string:', step);
        if (step === 'approved') {
          console.log('Redirecting to dashboard...');
          setIsNavigating(true);
          navigate(ROUTES.COMPANY_DASHBOARD, { replace: true });
          return;
        } else if (step === 'rejected') {
          console.log('Redirecting to review status...');
          setIsNavigating(true);
          navigate(ROUTES.COMPANY_REVIEW_STATUS, { replace: true });
          return;
        } else if (step === 'completed') {
          console.log('Redirecting to review status...');
          setIsNavigating(true);
          navigate(ROUTES.COMPANY_REVIEW_STATUS, { replace: true });
          return;
        } else if (step === 'step3') {
          setCurrentStep(3);
        } else {
          setCurrentStep(2);
        }
      }
    } catch (error: unknown) {
      console.error('=== Frontend Error ===');
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const axiosError = isAxiosError ? (error as { response?: { data?: unknown; status?: number; headers?: unknown } }) : null;
      console.error('Error details:', axiosError?.response?.data);
      console.error('Status:', axiosError?.response?.status);
      console.error('Headers:', axiosError?.response?.headers);
    }
  };


  const handleInputChange = (
    field: keyof CompanyData,
    value: string | number | undefined,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const step2Data = {
        industry: formData.industry,
        size: formData.size,
        website: formData.website,
        description: formData.description,
        logo: formData.logo,
        foundedYear: formData.foundedYear,
        headquarters: formData.headquarters,
        phone: formData.phone,
        linkedinUrl: formData.linkedinUrl,
        businessType: formData.businessType,
      };

      await api.post<{ success: boolean; message: string }>('/company/profile/step2', step2Data);
      setSuccess('Step 2 completed! Moving to final step...');
      setTimeout(() => {
        setCurrentStep(3);
        setSuccess('');
      }, 1000);
    } catch (err: unknown) {
      const isAxiosError = err && typeof err === 'object' && 'response' in err;
      const axiosError = isAxiosError ? (err as { response?: { data?: { error?: string } } }) : null;
      setError(axiosError?.response?.data?.error || 'Failed to save profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const step3Data = {
        contactPersonName: formData.contactPersonName,
        contactPersonTitle: formData.contactPersonTitle,
        contactPersonEmail: formData.contactPersonEmail,
        contactPersonPhone: formData.contactPersonPhone,
      };

      await api.post<{ success: boolean; message: string }>('/company/profile/step3', step3Data);
      setSuccess('Profile completed! Redirecting to review status...');
      setTimeout(() => {
        navigate(ROUTES.COMPANY_REVIEW_STATUS);
      }, 2000);
    } catch (err: unknown) {
      const isAxiosError = err && typeof err === 'object' && 'response' in err;
      const axiosError = isAxiosError ? (err as { response?: { data?: { error?: string } } }) : null;
      setError(axiosError?.response?.data?.error || 'Failed to complete profile');
    } finally {
      setLoading(false);
    }
  };

  const renderStep2 = () => (
    <form onSubmit={handleStep2Submit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Industry */}
        <div className="space-y-2">
          <Label htmlFor="industry">Industry *</Label>
          <select
            id="industry"
            value={formData.industry}
            onChange={(e) => handleInputChange('industry', e.target.value)}
            disabled={loadingCategories}
            className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">{loadingCategories ? 'Loading categories...' : 'Select industry'}</option>
            {industryCategories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Company Size */}
        <div className="space-y-2">
          <Label htmlFor="size">Company Size *</Label>
          <Select
            value={formData.size}
            onChange={(e) => handleInputChange('size', e.target.value)}
          >
            <option value="">Select company size</option>
            <option value="1-10">1-10 employees</option>
            <option value="11-50">11-50 employees</option>
            <option value="51-200">51-200 employees</option>
            <option value="200+">200+ employees</option>
          </Select>
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => handleInputChange('website', e.target.value)}
            placeholder="https://www.company.com"
          />
        </div>

        {/* Founded Year */}
        <div className="space-y-2">
          <Label htmlFor="foundedYear">Founded Year</Label>
          <Input
            id="foundedYear"
            type="number"
            min="1800"
            max={new Date().getFullYear()}
            value={formData.foundedYear || ''}
            onChange={(e) =>
              handleInputChange(
                'foundedYear',
                parseInt(e.target.value) || undefined,
              )
            }
            placeholder="2020"
          />
        </div>

        {/* Headquarters */}
        <div className="space-y-2">
          <Label htmlFor="headquarters">Headquarters</Label>
          <Input
            id="headquarters"
            value={formData.headquarters}
            onChange={(e) => handleInputChange('headquarters', e.target.value)}
            placeholder="New York, NY"
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="+1 (555) 123-4567"
          />
        </div>

        {/* Business Type */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="businessType">Business Type</Label>
          <Select
            value={formData.businessType}
            onChange={(e) => handleInputChange('businessType', e.target.value)}
          >
            <option value="">Select business type</option>
            <option value="Private">Private</option>
            <option value="Public">Public</option>
            <option value="Startup">Startup</option>
            <option value="Non-profit">Non-profit</option>
          </Select>
        </div>

        {/* LinkedIn URL */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="linkedinUrl">LinkedIn Company Page</Label>
          <Input
            id="linkedinUrl"
            type="url"
            value={formData.linkedinUrl}
            onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
            placeholder="https://linkedin.com/company/your-company"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Company Description *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Tell us about your company, mission, and what makes you unique..."
          rows={4}
          required
        />
        <p className="text-xs text-gray-500">
          {formData.description?.length || 0}/500 characters
        </p>
      </div>

      <Button
        type="submit"
        className="w-full bg-purple-600 hover:bg-purple-700"
        disabled={
          loading ||
          !formData.industry ||
          !formData.size ||
          !formData.description
        }
      >
        {loading ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Saving...</span>
          </div>
        ) : (
          <>
            Continue to Step 3
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );

  const renderStep3 = () => (
    <form onSubmit={handleStep3Submit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Person Name */}
        <div className="space-y-2">
          <Label htmlFor="contactPersonName">Contact Person Name *</Label>
          <Input
            id="contactPersonName"
            value={formData.contactPersonName}
            onChange={(e) =>
              handleInputChange('contactPersonName', e.target.value)
            }
            placeholder="John Doe"
            required
          />
        </div>

        {/* Contact Person Title */}
        <div className="space-y-2">
          <Label htmlFor="contactPersonTitle">Job Title *</Label>
          <Select
            value={formData.contactPersonTitle}
            onChange={(e) =>
              handleInputChange('contactPersonTitle', e.target.value)
            }
          >
            <option value="">Select job title</option>
            <option value="CEO">CEO</option>
            <option value="HR Manager">HR Manager</option>
            <option value="Recruiter">Recruiter</option>
            <option value="Hiring Manager">Hiring Manager</option>
            <option value="Founder">Founder</option>
            <option value="Other">Other</option>
          </Select>
        </div>

        {/* Contact Person Email */}
        <div className="space-y-2">
          <Label htmlFor="contactPersonEmail">Contact Email *</Label>
          <Input
            id="contactPersonEmail"
            type="email"
            value={formData.contactPersonEmail}
            onChange={(e) =>
              handleInputChange('contactPersonEmail', e.target.value)
            }
            placeholder="john@company.com"
            required
          />
        </div>

        {/* Contact Person Phone */}
        <div className="space-y-2">
          <Label htmlFor="contactPersonPhone">Contact Phone</Label>
          <Input
            id="contactPersonPhone"
            type="tel"
            value={formData.contactPersonPhone}
            onChange={(e) =>
              handleInputChange('contactPersonPhone', e.target.value)
            }
            placeholder="+1 (555) 123-4567"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep(2)}
          className="flex-1"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Step 2
        </Button>

        <Button
          type="submit"
          className="flex-1 bg-purple-600 hover:bg-purple-700"
          disabled={
            loading ||
            !formData.contactPersonName ||
            !formData.contactPersonTitle ||
            !formData.contactPersonEmail
          }
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Completing...</span>
            </div>
          ) : (
            'Complete Profile'
          )}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 2
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              2
            </div>
            <div
              className={`h-1 w-16 ${
                currentStep >= 3 ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            ></div>
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                currentStep >= 3
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              3
            </div>
          </div>
          <div className="text-center mt-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {currentStep === 2 ? 'Company Information' : 'Contact Details'}
            </h1>
            <p className="text-gray-600">
              {currentStep === 2
                ? 'Tell us about your company'
                : 'Who should candidates contact?'}
            </p>
          </div>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <CardTitle className="text-xl">Step {currentStep} of 3</CardTitle>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {currentStep === 2 ? renderStep2() : renderStep3()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CompanyProfileSetup;
