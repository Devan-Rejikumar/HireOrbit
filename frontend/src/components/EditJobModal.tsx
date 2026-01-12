import React, { useState, useEffect } from 'react';
import { SlideModal } from '@/components/ui/slide-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Plus, X } from 'lucide-react';
import api from '@/api/axios';

type UpdateJobData = {
  title: string;
  description: string;
  company: string;
  location: string;
  salary?: number;
  jobType: string;
  requirements: string[];
  benefits: string[];
  experienceLevel: string;
  education: string;
  applicationDeadline: string;
  workLocation: string;
};

type JobSummary = {
  id: string;
  title: string;
  description?: string;
  company: string;
  location: string;
  salary?: number;
  jobType: string;
  requirements: string[];
  benefits: string[];
  experienceLevel: string;
  education: string;
  applicationDeadline: string;
  workLocation: string;
};

interface EditJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: JobSummary | null;
  onJobUpdated: () => void;
}

const EditJobModal: React.FC<EditJobModalProps> = ({
  isOpen,
  onClose,
  job,
  onJobUpdated,
}) => {
  const [formData, setFormData] = useState<UpdateJobData>({
    title: '',
    description: '',
    company: '',
    location: '',
    salary: undefined,
    jobType: '',
    requirements: [''],
    benefits: [''],
    experienceLevel: '',
    education: '',
    applicationDeadline: '',
    workLocation: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];
  
  // Calculate min date: allow existing deadline if it's in the past, otherwise use today
  const minDate = job?.applicationDeadline 
    ? (() => {
        try {
          const existingDeadline = new Date(job.applicationDeadline).toISOString().split('T')[0];
          return existingDeadline < today ? existingDeadline : today;
        } catch {
          return today;
        }
      })()
    : today;

  useEffect(() => {
    if (job) {
      // Clear any previous messages when opening modal
      setError('');
      setSuccess('');
      
      // Format the application deadline for date input (YYYY-MM-DD)
      const deadlineDate = job.applicationDeadline ? 
        (() => {
          try {
            const date = new Date(job.applicationDeadline);
            // Check if date is valid
            if (isNaN(date.getTime())) {
              return '';
            }
            return date.toISOString().split('T')[0];
          } catch (error) {
            return '';
          }
        })() : '';
      
      setFormData({
        title: job.title,
        description: job.description || '',
        company: job.company,
        location: job.location,
        salary: job.salary,
        jobType: job.jobType,
        requirements: job.requirements.length > 0 ? job.requirements : [''],
        benefits: job.benefits.length > 0 ? job.benefits : [''],
        experienceLevel: job.experienceLevel,
        education: job.education,
        applicationDeadline: deadlineDate,
        workLocation: job.workLocation,
      });
    }
  }, [job]);

  // Clear messages when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof UpdateJobData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleArrayChange = (field: 'requirements' | 'benefits', index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item),
    }));
  };

  const addArrayItem = (field: 'requirements' | 'benefits') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const removeArrayItem = (field: 'requirements' | 'benefits', index: number) => {
    if (formData[field].length > 1) {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;
    
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const cleanedData: UpdateJobData = {
        ...formData,
        requirements: formData.requirements.filter(req => req.trim() !== ''),
        benefits: formData.benefits.filter(benefit => benefit.trim() !== ''),
        salary: formData.salary || undefined,
      };

      await api.put(`/jobs/${job.id}`, cleanedData);
      setSuccess('Job updated successfully!');
      onJobUpdated();
      
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update job';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const jobTypes = [
    'Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', 'Remote',
  ];

  const experienceLevels = [
    'Entry Level',
    'Mid Level',
    'Senior Level',
    'Executive Level',
  ];

  const educationLevels = [
    'High School',
    'Associate Degree',
    'Bachelor\'s Degree',
    'Master\'s Degree',
    'PhD',
    'No Degree Required',
  ];

  const workLocations = [
    'On-site',
    'Remote',
    'Hybrid',
  ];

  return (
    <SlideModal isOpen={isOpen} onClose={onClose} title="Edit Job">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="title">Job Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company Name *</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jobType">Job Type *</Label>
            <select
              id="jobType"
              value={formData.jobType}
              onChange={(e) => handleInputChange('jobType', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            >
              <option value="">Select job type</option>
              {jobTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="salary">Salary (Optional)</Label>
            <Input
              id="salary"
              type="number"
              value={formData.salary || ''}
              onChange={(e) => handleInputChange('salary', e.target.value)}
            />
          </div>
        </div>

        {/* Job Requirements */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">Job Requirements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="experienceLevel">Experience Level *</Label>
              <select
                id="experienceLevel"
                value={formData.experienceLevel}
                onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Select experience level</option>
                {experienceLevels.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="education">Education Requirements *</Label>
              <select
                id="education"
                value={formData.education}
                onChange={(e) => handleInputChange('education', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Select education level</option>
                {educationLevels.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workLocation">Work Location *</Label>
              <select
                id="workLocation"
                value={formData.workLocation}
                onChange={(e) => handleInputChange('workLocation', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="">Select work location</option>
                {workLocations.map((location) => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicationDeadline">Application Deadline *</Label>
              <Input
                id="applicationDeadline"
                type="date"
                value={formData.applicationDeadline}
                onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
                min={minDate}
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Job Description *</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={6}
            required
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Requirements *</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem('requirements')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Requirement
            </Button>
          </div>
          {formData.requirements.map((requirement, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={requirement}
                onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                placeholder={`Requirement ${index + 1}`}
                required={index === 0}
              />
              {formData.requirements.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeArrayItem('requirements', index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Benefits</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem('benefits')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Benefit
            </Button>
          </div>
          {formData.benefits.map((benefit, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={benefit}
                onChange={(e) => handleArrayChange('benefits', index, e.target.value)}
                placeholder={`Benefit ${index + 1}`}
              />
              {formData.benefits.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeArrayItem('benefits', index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-4 pt-6">
          <Button type="button" variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
            {loading ? 'Updating...' : 'Update Job'}
          </Button>
        </div>
      </form>
    </SlideModal>
  );
};

export default EditJobModal;