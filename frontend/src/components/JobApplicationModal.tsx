import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { FormField } from './ui/FormField';
import { FileUpload } from './ui/FileUpload';
import { ExperienceSelector } from './ui/ExperienceSelector';
import { _applicationService, ApplicationResponse } from '../api/applicationService';
import { userService } from '../api/userService';
import { MESSAGES } from '@/constants/messages';

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  companyName: string;
  companyId?: string;
  applicationDeadline?: string;
  onApplicationSubmit: (applicationData: ApplicationData) => void;
}

interface ApplicationData {
  jobId: string;
  coverLetter: string;
  resume: File | null;
  expectedSalary: string;
  availability: string;
  experience: string;
  resumeUrl?: string;
}

interface FormErrors {
  coverLetter?: string;
  resume?: string;
  expectedSalary?: string;
  availability?: string;
  experience?: string;
}

export const JobApplicationModal: React.FC<JobApplicationModalProps> = ({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  companyName,
  companyId,
  applicationDeadline,
  onApplicationSubmit,
}) => {
  const [formData, setFormData] = useState<ApplicationData>({
    jobId,
    coverLetter: '',
    resume: null,
    expectedSalary: '',
    availability: '',
    experience: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [savedResume, setSavedResume] = useState<string | null>(null);
  const [useSavedResume, setUseSavedResume] = useState(false);
  const [loadingResume, setLoadingResume] = useState(false);

  // Fetch saved resume when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchSavedResume();
    } else {
      // Reset state when modal closes
      setSavedResume(null);
      setUseSavedResume(false);
      setFormData({
        jobId,
        coverLetter: '',
        resume: null,
        expectedSalary: '',
        availability: '',
        experience: '',
      });
    }
  }, [isOpen]);

  const fetchSavedResume = async () => {
    try {
      setLoadingResume(true);
      const response = await userService.getResume();
      if (response.data?.resume) {
        setSavedResume(response.data.resume);
      }
    } catch (error) {
      // User might not have a saved resume, that's okay
      setSavedResume(null);
    } finally {
      setLoadingResume(false);
    }
  };

  const handleInputChange = (field: keyof ApplicationData, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Check if application deadline has passed
    if (applicationDeadline) {
      const deadline = new Date(applicationDeadline);
      const now = new Date();
      if (deadline < now) {
        toast.error('Application deadline has passed. This job is no longer accepting applications.');
        return false;
      }
    }

    // Cover Letter validation - minimum 10 characters (matches backend)
    if (!formData.coverLetter.trim()) {
      newErrors.coverLetter = 'Cover letter is required';
    } else if (formData.coverLetter.trim().length < 10) {
      newErrors.coverLetter = 'Cover letter must be at least 10 characters';
    } else if (formData.coverLetter.trim().length > 5000) {
      newErrors.coverLetter = 'Cover letter must be less than 5000 characters';
    }

    // Resume validation: either use saved resume OR upload new one
    if (useSavedResume) {
      if (!savedResume) {
        newErrors.resume = 'No saved resume found. Please upload a new resume.';
      }
    } else {
      if (!formData.resume) {
        newErrors.resume = 'Resume is required';
      }
    }

    // Expected Salary validation - basic format check
    if (!formData.expectedSalary.trim()) {
      newErrors.expectedSalary = 'Expected salary is required';
    } else {
      const salaryRegex = /[\d,.-]/;
      if (!salaryRegex.test(formData.expectedSalary)) {
        newErrors.expectedSalary = 'Please enter a valid salary format (e.g., ₹5,00,000 - ₹6,00,000)';
      }
    }

    if (!formData.availability.trim()) {
      newErrors.availability = 'Availability is required';
    }

    if (!formData.experience.trim()) {
      newErrors.experience = 'Experience level is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      interface ApplicationData {
        jobId: string;
        companyId?: string;
        coverLetter: string;
        expectedSalary?: string;
        availability?: string;
        experience?: string;
        resumeUrl?: string;
        resumeBase64?: string;
        resumeFileName?: string;
      }
      const applicationData: ApplicationData = {
        jobId,
        companyId: companyId || companyName, // Use companyId if available, fallback to companyName
        coverLetter: formData.coverLetter,
        expectedSalary: formData.expectedSalary,
        availability: formData.availability,
        experience: formData.experience,
      };

      // If using saved resume, send resumeUrl; otherwise upload new file
      if (useSavedResume && savedResume) {
        applicationData.resumeUrl = savedResume;
      } else if (formData.resume) {
        const resumeBase64 = await fileToBase64(formData.resume);
        applicationData.resumeBase64 = resumeBase64;
        applicationData.resumeFileName = formData.resume.name;
      }

      // Use the application service
      const result: ApplicationResponse = await _applicationService.applyForJob(applicationData);
      
      // Call the callback to notify parent component
      onApplicationSubmit({
        jobId,
        coverLetter: formData.coverLetter,
        resume: formData.resume,
        expectedSalary: formData.expectedSalary,
        availability: formData.availability,
        experience: formData.experience,
        resumeUrl: result.data.resumeUrl || savedResume || undefined,
      });
      
      toast.success(MESSAGES.SUCCESS.APPLICATION_SUBMITTED);
      onClose();
    } catch (error: unknown) {
      let errorMessage = 'Failed to submit application. Please try again.';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string }; status?: number } };
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        } else if (axiosError.response?.status === 400) {
          errorMessage = 'Application deadline has passed or invalid application data.';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String((error as { message: unknown }).message);
      }
      
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Remove the data:type;base64, prefix to get just the base64 string
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleClose = () => {
    if (!submitting) {
      setFormData({
        jobId,
        coverLetter: '',
        resume: null,
        expectedSalary: '',
        availability: '',
        experience: '',
      });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Apply for Job</h2>
            <p className="text-gray-600 mt-1 text-sm">{jobTitle} at {companyName}</p>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-white">
          
          <ExperienceSelector
            value={formData.experience}
            onChange={(value) => handleInputChange('experience', value)}
            error={errors.experience}
          />
          

          {/* Cover Letter */}
          <FormField label="Cover Letter" required error={errors.coverLetter}>
            <textarea
              value={formData.coverLetter}
              onChange={(e) => handleInputChange('coverLetter', e.target.value)}
              placeholder="Tell us why you're interested in this position..."
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                errors.coverLetter ? 'border-red-300' : 'border-gray-300'
              }`}
              rows={5}
              maxLength={5000}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.coverLetter && (
                <p className="text-xs text-red-600">{errors.coverLetter}</p>
              )}
              <p className={`text-xs ml-auto ${
                formData.coverLetter.length < 10 
                  ? 'text-red-600' 
                  : formData.coverLetter.length > 5000 
                    ? 'text-red-600' 
                    : 'text-gray-500'
              }`}>
                {formData.coverLetter.length}/5000 characters (minimum 10)
              </p>
            </div>
          </FormField>

          {/* Resume Selection */}
          <FormField label="Resume" required error={errors.resume}>
            {savedResume && (
              <div className="mb-4 space-y-3">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="resumeOption"
                      checked={useSavedResume}
                      onChange={() => {
                        setUseSavedResume(true);
                        handleInputChange('resume', null);
                        if (errors.resume) {
                          setErrors(prev => ({ ...prev, resume: undefined }));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Use saved resume from profile
                    </span>
                  </label>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="resumeOption"
                      checked={!useSavedResume}
                      onChange={() => {
                        setUseSavedResume(false);
                        if (errors.resume) {
                          setErrors(prev => ({ ...prev, resume: undefined }));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Upload new resume
                    </span>
                  </label>
                </div>
                {useSavedResume && savedResume && (
                  <div className="ml-6 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">
                      ✓ Using saved resume from your profile
                    </p>
                  </div>
                )}
              </div>
            )}
            {loadingResume && (
              <div className="text-sm text-gray-500 mb-2">Checking for saved resume...</div>
            )}
            {!useSavedResume && (
              <FileUpload
                onFileSelect={(file) => {
                  handleInputChange('resume', file);
                  setUseSavedResume(false);
                }}
                error={errors.resume}
                accept=".pdf,.doc,.docx"
              />
            )}
          </FormField>

          {/* Expected Salary */}
          <FormField label="Expected Salary" required error={errors.expectedSalary}>
            <input
              type="text"
              value={formData.expectedSalary}
              onChange={(e) => handleInputChange('expectedSalary', e.target.value)}
              placeholder="e.g., ₹5,00,000 - ₹6,00,000"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.expectedSalary ? 'border-red-300' : 'border-gray-300'
              }`}
            />
          </FormField>

          {/* Availability */}
          <FormField label="Availability" required error={errors.availability}>
            <select
              value={formData.availability}
              onChange={(e) => handleInputChange('availability', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.availability ? 'border-red-300' : 'border-gray-300'
              }`}
            >
              <option value="">Select availability</option>
              <option value="immediate">Immediate</option>
              <option value="2-weeks">2 weeks notice</option>
              <option value="1-month">1 month notice</option>
              <option value="2-months">2 months notice</option>
              <option value="3-months">3 months notice</option>
            </select>
          </FormField>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-5 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-sm hover:shadow-md"
            >
              {submitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Application'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobApplicationModal;