import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [validationErrors, setValidationErrors] = useState<{
    description?: string;
    foundedYear?: string;
    phone?: string;
    contactPersonPhone?: string;
  }>({});
  useEffect(() => {
    // Fetch industry categories
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await api.get<{ data: { categories: Array<{ id: string; name: string }> } }>('/industries');
        setIndustryCategories(response.data?.data?.categories || []);
      } catch (_err) {
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
      } catch (_err) {
        // keep silent for now; page still works without prefill
      }
    })();
  }, []);

  const checkProfileStep = useCallback(async () => {
    if(isNavigating) return;
    try {
      const response = await api.get<ProfileStepResponse>(
        '/company/profile/step',
      );
      const step = response.data.data?.profileStep;
      if (step === null || step === undefined) {
        setCurrentStep(2);
      } else if (typeof step === 'object') {
        // Check if it's a completed profile object
        if (step.profileCompleted) {
          setIsNavigating(true);
          navigate(ROUTES.COMPANY_REVIEW_STATUS, { replace: true });
          return;
        } else {
          setCurrentStep(2);
        }
      } else if (typeof step === 'string') {
        if (step === 'approved') {
          setIsNavigating(true);
          navigate(ROUTES.COMPANY_DASHBOARD, { replace: true });
          return;
        } else if (step === 'rejected') {
          setIsNavigating(true);
          navigate(ROUTES.COMPANY_REVIEW_STATUS, { replace: true });
          return;
        } else if (step === 'completed') {
          setIsNavigating(true);
          navigate(ROUTES.COMPANY_REVIEW_STATUS, { replace: true });
          return;
        } else if (step === 'step3') {
          setCurrentStep(3);
        } else {
          setCurrentStep(2);
        }
      }
    } catch (_error: unknown) {
      // Silently handle errors
    }
  }, [isNavigating, navigate]);

  useEffect(() => {
    if (!hasCheckedProfile.current) {
      hasCheckedProfile.current = true;
      checkProfileStep();
    }
  }, [isNavigating, checkProfileStep]);


  // Indian phone number validation function
  const validateIndianPhone = (phone: string | undefined): string | undefined => {
    if (!phone || phone.trim() === '') return undefined; // Allow empty for optional fields
    
    // Remove spaces, dashes, parentheses for validation
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // Check if it starts with +91 or 0, then remove country code/leading zero
    let digits = cleaned;
    if (cleaned.startsWith('+91')) {
      digits = cleaned.substring(3);
    } else if (cleaned.startsWith('91') && cleaned.length === 12) {
      digits = cleaned.substring(2);
    } else if (cleaned.startsWith('0') && cleaned.length === 11) {
      digits = cleaned.substring(1);
    }
    
    // Mobile number validation (10 digits starting with 6-9)
    if (digits.length === 10 && /^[6-9]/.test(digits)) {
      if (!/^\d{10}$/.test(digits)) {
        return 'Invalid mobile number. Must be exactly 10 digits starting with 6, 7, 8, or 9 (e.g., 9876543210)';
      }
      return undefined; // Valid
    }
    
    // Landline validation (area code + number, total 8-12 digits)
    if (digits.length >= 8 && digits.length <= 12) {
      if (!/^\d{8,12}$/.test(digits)) {
        return 'Invalid landline number. Must be 8-12 digits with area code (e.g., 022-12345678)';
      }
      return undefined; // Valid
    }
    
    // Provide helpful error message
    if (digits.length < 8) {
      return `Phone number is too short. You entered ${digits.length} digit${digits.length !== 1 ? 's' : ''}. Mobile numbers need 10 digits (e.g., 9876543210).`;
    } else if (digits.length > 12) {
      return `Phone number is too long. You entered ${digits.length} digits. Maximum is 12 digits for landline numbers.`;
    } else if (digits.length === 10 && !/^[6-9]/.test(digits)) {
      return 'Mobile numbers must start with 6, 7, 8, or 9. Please check your number.';
    }
    
    return 'Please enter a valid Indian phone number. Examples: +91 9876543210, 9876543210, or 022-12345678';
  };

  const handleInputChange = (
    field: keyof CompanyData,
    value: string | number | undefined,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    
    // Validate phone numbers in real-time
    if (field === 'phone' && typeof value === 'string') {
      if (value.trim() === '') {
        // Clear error when phone is cleared (it's optional)
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.phone;
          return newErrors;
        });
      } else {
        const error = validateIndianPhone(value);
        setValidationErrors(prev => ({ ...prev, phone: error }));
      }
    } else if (field === 'contactPersonPhone' && typeof value === 'string') {
      if (value.trim() === '') {
        // Clear error when contactPersonPhone is cleared
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.contactPersonPhone;
          return newErrors;
        });
      } else {
        const error = validateIndianPhone(value);
        setValidationErrors(prev => ({ ...prev, contactPersonPhone: error }));
      }
    } else if (field === 'phone' || field === 'contactPersonPhone') {
      // Clear error when field is cleared
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Clear description error when user starts typing
    if (field === 'description' && validationErrors.description) {
      setValidationErrors(prev => ({ ...prev, description: undefined }));
    }
    
    // Clear foundedYear error when user starts typing
    if (field === 'foundedYear' && validationErrors.foundedYear) {
      setValidationErrors(prev => ({ ...prev, foundedYear: undefined }));
    }
  };

  // Validation function for Step 2
  const validateStep2 = (): boolean => {
    let hasRequiredErrors = false;

    // Validate description (REQUIRED)
    if (!formData.description || formData.description.trim().length === 0) {
      hasRequiredErrors = true;
    } else if (formData.description.trim().length < 50) {
      hasRequiredErrors = true;
    } else if (formData.description.length > 500) {
      hasRequiredErrors = true;
    }

    // Check other required fields
    if (!formData.industry || !formData.size) {
      hasRequiredErrors = true;
    }

    // Note: Founded Year and Phone are OPTIONAL - they don't block submission
    // Inline errors will still show for user guidance

    return !hasRequiredErrors;
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate before submitting - this will set validation errors
    if (!validateStep2()) {
      setError('Please fix all validation errors below before continuing');
      return;
    }

    setLoading(true);

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

  // Validation function for Step 3
  const validateStep3 = (): boolean => {
    const errors: { contactPersonPhone?: string } = {};

    // Validate contact person phone (required in step 3)
    if (!formData.contactPersonPhone || formData.contactPersonPhone.trim() === '') {
      errors.contactPersonPhone = 'Contact person phone number is required. Please enter a valid Indian phone number.';
    } else {
      const phoneError = validateIndianPhone(formData.contactPersonPhone);
      if (phoneError) {
        errors.contactPersonPhone = phoneError;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    // Validate before submitting
    if (!validateStep3()) {
      setError('Please fix the validation errors before continuing');
      return;
    }

    setLoading(true);

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
            className={validationErrors.foundedYear ? 'border-red-500 focus:ring-red-500' : ''}
          />
          {validationErrors.foundedYear && (
            <p className="text-xs text-red-500 mt-1">{validationErrors.foundedYear}</p>
          )}
          <p className="text-xs text-gray-500">
            Optional: Year your company was founded (1800 - {new Date().getFullYear()})
          </p>
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
            placeholder="+91 9876543210 or 9876543210"
            className={validationErrors.phone ? 'border-red-500 focus:ring-red-500' : ''}
            maxLength={15}
          />
          {validationErrors.phone && (
            <p className="text-xs text-red-500 mt-1">{validationErrors.phone}</p>
          )}
          <p className="text-xs text-gray-500">
            Optional: Indian phone number (mobile: 10 digits starting with 6-9, or landline with area code)
          </p>
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
          className={validationErrors.description ? 'border-red-500 focus:ring-red-500' : ''}
          maxLength={500}
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-gray-500">
            {formData.description?.length || 0}/500 characters
            {formData.description && formData.description.trim().length < 50 && (
              <span className="text-orange-500 ml-1">
              (Minimum 50 characters required)
            </span>
            )}
          </p>
        </div>
        {validationErrors.description && (
          <p className="text-xs text-red-500 mt-1">{validationErrors.description}</p>
        )}
      </div>

      {/* Validation Errors Summary - Only for required fields */}
      {(!formData.industry || 
        !formData.size || 
        !formData.description || 
        (formData.description && formData.description.trim().length < 50)) && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="font-semibold mb-2">Please fix the following required fields:</div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {!formData.industry && (
                <li>• <strong>Industry:</strong> Please select an industry from the dropdown</li>
              )}
              {!formData.size && (
                <li>• <strong>Company Size:</strong> Please select a company size from the dropdown</li>
              )}
              {!formData.description && (
                <li>• <strong>Company Description:</strong> Description is required</li>
              )}
              {formData.description && formData.description.trim().length < 50 && (
                <li>• <strong>Company Description:</strong> Must be at least 50 characters (you have {formData.description.trim().length}, need {50 - formData.description.trim().length} more)</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={
          loading ||
          !formData.industry ||
          !formData.size ||
          !formData.description ||
          (formData.description && formData.description.trim().length < 50)
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
          <Label htmlFor="contactPersonPhone">Contact Phone *</Label>
          <Input
            id="contactPersonPhone"
            type="tel"
            value={formData.contactPersonPhone}
            onChange={(e) =>
              handleInputChange('contactPersonPhone', e.target.value)
            }
            placeholder="+91 9876543210 or 9876543210"
            required
            className={validationErrors.contactPersonPhone ? 'border-red-500 focus:ring-red-500' : ''}
            maxLength={15}
          />
          {validationErrors.contactPersonPhone && (
            <p className="text-xs text-red-500 mt-1">{validationErrors.contactPersonPhone}</p>
          )}
          <p className="text-xs text-gray-500">
            Indian phone number (mobile: 10 digits starting with 6-9, or landline with area code)
          </p>
        </div>
      </div>

      {/* Validation Errors Summary for Step 3 */}
      {((!formData.contactPersonName || 
         !formData.contactPersonTitle || 
         !formData.contactPersonEmail || 
         !formData.contactPersonPhone ||
         !!validationErrors.contactPersonPhone)) && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="font-semibold mb-2">Please fix the following errors to continue:</div>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {!formData.contactPersonName && (
                <li>• <strong>Contact Person Name:</strong> Please enter the contact person's name</li>
              )}
              {!formData.contactPersonTitle && (
                <li>• <strong>Job Title:</strong> Please select a job title from the dropdown</li>
              )}
              {!formData.contactPersonEmail && (
                <li>• <strong>Contact Email:</strong> Please enter a valid email address</li>
              )}
              {!formData.contactPersonPhone && (
                <li>• <strong>Contact Phone:</strong> Please enter a valid Indian phone number</li>
              )}
              {validationErrors.contactPersonPhone && (
                <li>• <strong>Contact Phone:</strong> {validationErrors.contactPersonPhone}</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

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
            !formData.contactPersonEmail ||
            !formData.contactPersonPhone ||
            !!validationErrors.contactPersonPhone
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
