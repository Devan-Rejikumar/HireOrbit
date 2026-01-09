import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Briefcase, CheckCircle, AlertCircle, Plus, X, Building2, MapPin, DollarSign, Calendar, GraduationCap, Users, Clock, Target, Star, CreditCard } from 'lucide-react';
import api from '@/api/axios';

interface JobFormData {
  title: string;
  description: string;
  company: string;
  location: string;
  salary: string;
  jobType: string;
  requirements: string[];
  benefits: string[];
  experienceLevel: string;
  education: string;
  applicationDeadline: string;
  workLocation: string;
}

const PostJob = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitError, setLimitError] = useState('');
  
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    company: '',
    location: '',
    salary: '',
    jobType: '',
    requirements: [''],
    benefits: [''],
    experienceLevel: '',
    education: '',
    applicationDeadline: '',
    workLocation: '',
  });

  const handleInputChange = (field: keyof JobFormData, value: string) => {
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

  const parseSalary = (salaryInput: string): number | null => {
    if (!salaryInput || salaryInput.trim() === '') {
      return null;
    }
    
    const trimmed = salaryInput.trim();
    
    // Check if it's a range (contains dash)
    if (trimmed.includes('-')) {
      const parts = trimmed.split('-').map(part => part.trim());
      if (parts.length === 2) {
        const min = parseInt(parts[0]);
        const max = parseInt(parts[1]);
        if (!isNaN(min) && !isNaN(max)) {
          // Return the average of the range
          return Math.round((min + max) / 2);
        }
      }
    }
    
    // Try to parse as single number
    const parsed = parseInt(trimmed);
    return isNaN(parsed) ? null : parsed;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Filter out empty requirements and benefits
      const cleanedData = {
        ...formData,
        requirements: formData.requirements.filter(req => req.trim() !== ''),
        benefits: formData.benefits.filter(benefit => benefit.trim() !== ''),
        salary: parseSalary(formData.salary),
      };

      await api.post('/jobs', cleanedData);
      setSuccess('Job posted successfully!');
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate(ROUTES.COMPANY_DASHBOARD);
      }, 2000);
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || 'Failed to post job';
      
      // Check if it's a job posting limit error
      if (errorMessage.toLowerCase().includes('job posting limit') || errorMessage.toLowerCase().includes('limit reached')) {
        setLimitError(errorMessage);
        setShowLimitModal(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const jobTypes = [
    'Full-time',
    'Part-time',
    'Contract',
    'Internship',
    'Freelance',
  ];

  const experienceLevels = [
    'Entry Level',
    'Mid Level',
    'Senior Level',
    'Lead/Principal',
    'Executive',
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="absolute inset-0 bg-gray-100/30"></div>
      
      <div className="relative z-10 p-6">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6 shadow-lg">
              <Briefcase className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-4">
              Post New Job
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Create an attractive job posting that will help you find the perfect candidate for your team
            </p>
            
            {/* Back Button */}
            <div className="mt-6">
              <Button
                variant="outline"
                onClick={() => navigate('/company/dashboard')}
                className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
          </div>

          {/* Main Form Card */}
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              {/* Status Messages */}
              {error && (
                <Alert className="mb-8 border-red-200 bg-red-50/80 backdrop-blur-sm">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-8 border-green-200 bg-green-50/80 backdrop-blur-sm">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 font-medium">{success}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-12">
                {/* Basic Information Section */}
                <div className="space-y-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl">
                      <Building2 className="h-6 w-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Job Title */}
                    <div className="space-y-3">
                      <Label htmlFor="title" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Target className="h-4 w-4 text-blue-600" />
                        Job Title *
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="e.g. Senior Software Engineer"
                        className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                        required
                      />
                    </div>

                    {/* Company Name */}
                    <div className="space-y-3">
                      <Label htmlFor="company" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        Company Name *
                      </Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        placeholder="Your company name"
                        className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                        required
                      />
                    </div>

                    {/* Location */}
                    <div className="space-y-3">
                      <Label htmlFor="location" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        Location *
                      </Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="e.g. New York, NY or Remote"
                        className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                        required
                      />
                    </div>

                    {/* Job Type */}
                    <div className="space-y-3">
                      <Label htmlFor="jobType" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        Job Type *
                      </Label>
                      <select
                        id="jobType"
                        value={formData.jobType}
                        onChange={(e) => handleInputChange('jobType', e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 bg-white"
                        required
                      >
                        <option value="">Select job type</option>
                        {jobTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Job Description Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl">
                      <Briefcase className="h-6 w-6 text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Job Description</h2>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                      Job Description *
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Describe the role, responsibilities, and what you're looking for..."
                      rows={6}
                      className="rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200 resize-none"
                      required
                    />
                  </div>
                </div>

                {/* Compensation & Details Section */}
                <div className="space-y-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Compensation & Details</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Salary */}
                    <div className="space-y-3">
                      <Label htmlFor="salary" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        Salary (Optional)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₹</span>
                        <Input
                          id="salary"
                          type="text"
                          value={formData.salary}
                          onChange={(e) => handleInputChange('salary', e.target.value)}
                          placeholder="e.g. 75000 or 40000-80000"
                          className="h-12 rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 pl-8"
                        />
                      </div>
                      <p className="text-xs text-gray-500">Enter a single amount (e.g., 75000) or a range (e.g., 40000-80000)</p>
                    </div>

                    {/* Experience Level */}
                    <div className="space-y-3">
                      <Label htmlFor="experienceLevel" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-600" />
                        Experience Level *
                      </Label>
                      <select
                        id="experienceLevel"
                        value={formData.experienceLevel}
                        onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 bg-white"
                        required
                      >
                        <option value="">Select experience level</option>
                        {experienceLevels.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Education */}
                    <div className="space-y-3">
                      <Label htmlFor="education" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-green-600" />
                        Education Requirement *
                      </Label>
                      <select
                        id="education"
                        value={formData.education}
                        onChange={(e) => handleInputChange('education', e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 bg-white"
                        required
                      >
                        <option value="">Select education level</option>
                        {educationLevels.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Work Location */}
                    <div className="space-y-3">
                      <Label htmlFor="workLocation" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-600" />
                        Work Location *
                      </Label>
                      <select
                        id="workLocation"
                        value={formData.workLocation}
                        onChange={(e) => handleInputChange('workLocation', e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border border-gray-200 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 bg-white"
                        required
                      >
                        <option value="">Select work location</option>
                        {workLocations.map((location) => (
                          <option key={location} value={location}>
                            {location}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Application Deadline */}
                    <div className="space-y-3 lg:col-span-2">
                      <Label htmlFor="applicationDeadline" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-green-600" />
                        Application Deadline *
                      </Label>
                      <Input
                        id="applicationDeadline"
                        type="date"
                        value={formData.applicationDeadline}
                        onChange={(e) => handleInputChange('applicationDeadline', e.target.value)}
                        className="h-12 rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Requirements & Benefits Section */}
                <div className="space-y-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-r from-orange-100 to-red-100 rounded-xl">
                      <Star className="h-6 w-6 text-orange-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Requirements & Benefits</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Requirements */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Target className="h-4 w-4 text-orange-600" />
                          Requirements *
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addArrayItem('requirements')}
                          className="flex items-center gap-2 bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                        >
                          <Plus className="h-4 w-4" />
                          Add Requirement
                        </Button>
                      </div>
                      {formData.requirements.map((requirement, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={requirement}
                            onChange={(e) => handleArrayChange('requirements', index, e.target.value)}
                            placeholder={`Requirement ${index + 1}`}
                            className="rounded-xl border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200"
                            required={index === 0}
                          />
                          {formData.requirements.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeArrayItem('requirements', index)}
                              className="px-3 border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Benefits */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Star className="h-4 w-4 text-orange-600" />
                          Benefits
                        </Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addArrayItem('benefits')}
                          className="flex items-center gap-2 bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                        >
                          <Plus className="h-4 w-4" />
                          Add Benefit
                        </Button>
                      </div>
                      {formData.benefits.map((benefit, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={benefit}
                            onChange={(e) => handleArrayChange('benefits', index, e.target.value)}
                            placeholder={`Benefit ${index + 1}`}
                            className="rounded-xl border-gray-200 focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-200"
                          />
                          {formData.benefits.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeArrayItem('benefits', index)}
                              className="px-3 border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Submit Section */}
                <div className="pt-8 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/company/dashboard')}
                      className="flex-1 h-12 rounded-xl border-gray-200 hover:bg-gray-50 transition-all duration-200"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || !formData.title || !formData.company || !formData.location || !formData.jobType || !formData.description}
                      className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Posting Job...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          Post Job
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Job Posting Limit Modal - Slides in from right */}
      {showLimitModal && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300"
            onClick={() => setShowLimitModal(false)}
          />
          
          {/* Modal - Slides in from right */}
          <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
            showLimitModal ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Job Posting Limit Reached</h2>
                </div>
                <button
                  onClick={() => setShowLimitModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-gray-700 leading-relaxed">
                      {limitError}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">Upgrade your plan to post more jobs:</h3>
                    <div className="space-y-2">
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Star className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold text-blue-900">Basic Plan</span>
                        </div>
                        <p className="text-sm text-gray-600">Post up to 10 jobs</p>
                      </div>
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Star className="h-4 w-4 text-purple-600" />
                          <span className="font-semibold text-purple-900">Premium Plan</span>
                        </div>
                        <p className="text-sm text-gray-600">Unlimited job postings</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50 space-y-3">
                <Button
                  onClick={() => {
                    setShowLimitModal(false);
                    navigate(ROUTES.SUBSCRIPTIONS);
                  }}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Upgrade Plan
                  </div>
                </Button>
                <Button
                  onClick={() => setShowLimitModal(false)}
                  variant="outline"
                  className="w-full h-12 rounded-xl border-gray-300 hover:bg-gray-100 transition-all duration-200"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PostJob;