import React, { useState, useEffect } from 'react';
import { X, FileText, Upload } from 'lucide-react';
import { toast } from 'react-toastify';
import { FormField } from './ui/FormField';
import { FileUpload } from './ui/FileUpload';
import { ExperienceSelector } from './ui/ExperienceSelector';
import { jobService } from '../api/jobService';
import { userService } from '../api/userService';

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
  companyName: string;
  onApplicationSubmit: (applicationData: ApplicationData) => void;
}

interface ApplicationData {
  coverLetter: string;
  resume: File | null;
  resumeUrl?: string; // For selected resume from profile
  expectedSalary: string;
  availability: string;
  experience: string;
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
  onApplicationSubmit,
}) => {
  const [formData, setFormData] = useState<ApplicationData>({
    coverLetter: '',
    resume: null,
    resumeUrl: '',
    expectedSalary: '',
    availability: '',
    experience: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [userResume, setUserResume] = useState<string | null>(null);
  const [resumeOption, setResumeOption] = useState<'upload' | 'profile'>('profile');
  const [loadingResume, setLoadingResume] = useState(false);

  // Fetch user's resume when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUserResume();
    }
  }, [isOpen]);

  const fetchUserResume = async () => {
    try {
      setLoadingResume(true);
      const response = await userService.getResume();
      if (response.success && response.data.resume) {
        setUserResume(response.data.resume);
        setFormData(prev => ({ ...prev, resumeUrl: response.data.resume }));
      }
    } catch (error) {
      console.error('Error fetching user resume:', error);
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

  const handleResumeOptionChange = (option: 'upload' | 'profile') => {
    setResumeOption(option);
    if (option === 'profile') {
      setFormData(prev => ({ ...prev, resume: null, resumeUrl: userResume || '' }));
    } else {
      setFormData(prev => ({ ...prev, resume: null, resumeUrl: '' }));
    }
    // Clear resume error when switching options
    if (errors.resume) {
      setErrors(prev => ({ ...prev, resume: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.coverLetter.trim()) {
      newErrors.coverLetter = 'Cover letter is required';
    }

    if (resumeOption === 'upload' && !formData.resume) {
      newErrors.resume = 'Please upload a resume file';
    } else if (resumeOption === 'profile' && !userResume) {
      newErrors.resume = 'No resume found in your profile. Please upload one first.';
    }

    if (!formData.expectedSalary.trim()) {
      newErrors.expectedSalary = 'Expected salary is required';
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
      
      // Create FormData for the complete application
      const applicationFormData = new FormData();
      
      // Handle resume based on selected option
      if (resumeOption === 'upload' && formData.resume) {
        applicationFormData.append('resume', formData.resume);
      } else if (resumeOption === 'profile' && userResume) {
        // For profile resume, we'll send the URL or handle it differently
        applicationFormData.append('resumeUrl', userResume);
      }
      
      applicationFormData.append('coverLetter', formData.coverLetter);
      applicationFormData.append('expectedSalary', formData.expectedSalary);
      applicationFormData.append('availability', formData.availability);
      applicationFormData.append('experience', formData.experience);

      // Use the job service instead of direct fetch
      const result = await jobService.applyForJob(jobId, applicationFormData);
      console.log('Application submitted successfully:', result);
      
      // Call the callback to notify parent component
      onApplicationSubmit({
        coverLetter: formData.coverLetter,
        resume: formData.resume,
        resumeUrl: formData.resumeUrl,
        expectedSalary: formData.expectedSalary,
        availability: formData.availability,
        experience: formData.experience,
      });
      
      onClose();
    } catch (error: any) {
      console.error('Application submission error:', error);
      toast.error(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setFormData({
        coverLetter: '',
        resume: null,
        resumeUrl: '',
        expectedSalary: '',
        availability: '',
        experience: '',
      });
      setErrors({});
      setResumeOption('profile');
      onClose();
    }
  };

const getFileName = (url: string) => {
  // Always return a clean filename
  const extension = url.includes('.pdf') ? 'pdf' : 'doc';
  return `resume.${extension}`;
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Apply for Job</h2>
            <p className="text-gray-600 mt-1">{jobTitle} at {companyName}</p>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
            />
          </FormField>

          {/* Resume Selection */}
          <FormField label="Resume" required error={errors.resume}>
            <div className="space-y-4">
              {/* Resume Option Selection */}
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="resumeOption"
                    value="profile"
                    checked={resumeOption === 'profile'}
                    onChange={(e) => handleResumeOptionChange('profile')}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Use Profile Resume</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="resumeOption"
                    value="upload"
                    checked={resumeOption === 'upload'}
                    onChange={(e) => handleResumeOptionChange('upload')}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Upload New Resume</span>
                </label>
              </div>

              {/* Profile Resume Display */}
              {resumeOption === 'profile' && (
                <div className="border border-gray-200 rounded-lg p-4">
                  {loadingResume ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-gray-600">Loading resume...</span>
                    </div>
                  ) : userResume ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Profile Resume</p>
                          <p className="text-xs text-gray-500">{getFileName(userResume)}</p>
                        </div>
                      </div>
                      <a
                        href={userResume}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View
                      </a>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No resume found in your profile</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Please upload a resume to your profile first
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Upload New Resume */}
              {resumeOption === 'upload' && (
                <FileUpload
                  onFileSelect={(file) => handleInputChange('resume', file)}
                  error={errors.resume}
                  accept=".pdf,.doc,.docx"
                />
              )}
            </div>
          </FormField>

          {/* Expected Salary */}
          <FormField label="Expected Salary" required error={errors.expectedSalary}>
            <input
              type="text"
              value={formData.expectedSalary}
              onChange={(e) => handleInputChange('expectedSalary', e.target.value)}
              placeholder="e.g., ₹5,00,000 - ₹6,00,000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </FormField>

          {/* Availability */}
          <FormField label="Availability" required error={errors.availability}>
            <select
              value={formData.availability}
              onChange={(e) => handleInputChange('availability', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobApplicationModal;