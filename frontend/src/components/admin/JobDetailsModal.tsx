import React, { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { MapPin, Briefcase, Clock, Building2, Calendar, DollarSign, FileText, CheckCircle, XCircle } from 'lucide-react';
import api from '@/api/axios';

interface Job {
  id: string;
  title: string;
  company: string;
  companyId?: string;
  location: string;
  jobType: string;
  salary?: number;
  isActive: boolean;
  createdAt: string;
  applicationDeadline: string;
  description?: string;
  requirements?: string[];
  benefits?: string[];
  experienceLevel?: string;
  education?: string;
  workLocation?: string;
}

interface JobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  initialJob?: Job;
}

const JobDetailsModal: React.FC<JobDetailsModalProps> = ({ isOpen, onClose, jobId, initialJob }) => {
  const [job, setJob] = useState<Job | null>(initialJob || null);
  const [loading, setLoading] = useState(!initialJob);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && jobId) {
      if (initialJob) {
        setJob(initialJob);
        setLoading(false);
      } else {
        fetchJobDetails();
      }
    }
  }, [isOpen, jobId, initialJob]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<{ success: boolean; data: { job: Job } }>(`/jobs/${jobId}`);
      setJob(response.data.data.job);
    } catch (err) {
      setError('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Not specified';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Job Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300 transition-colors"
              aria-label="Close"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400">{error}</p>
            </div>
          ) : job ? (
            <div className="space-y-6">
              {/* Job Title and Company */}
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{job.title}</h3>
                <div className="flex items-center gap-4 text-gray-300">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-purple-400" />
                    <span className="font-medium">{job.company}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-purple-400" />
                    <span>{job.location}</span>
                  </div>
                </div>
              </div>

              {/* Job Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                  <Briefcase className="h-5 w-5 text-purple-400" />
                  <div>
                    <p className="text-sm text-gray-400">Job Type</p>
                    <p className="font-semibold text-white capitalize">{job.jobType}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                  <DollarSign className="h-5 w-5 text-green-400" />
                  <div>
                    <p className="text-sm text-gray-400">Salary</p>
                    <p className="font-semibold text-white">{formatCurrency(job.salary)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                  <Calendar className="h-5 w-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Posted On</p>
                    <p className="font-semibold text-white">{formatDate(job.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                  <Clock className="h-5 w-5 text-orange-400" />
                  <div>
                    <p className="text-sm text-gray-400">Deadline</p>
                    <p className="font-semibold text-white">{formatDate(job.applicationDeadline)}</p>
                  </div>
                </div>

                {job.experienceLevel && (
                  <div className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                    <FileText className="h-5 w-5 text-indigo-400" />
                    <div>
                      <p className="text-sm text-gray-400">Experience</p>
                      <p className="font-semibold text-white">{job.experienceLevel}</p>
                    </div>
                  </div>
                )}

                {job.education && (
                  <div className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                    <FileText className="h-5 w-5 text-pink-400" />
                    <div>
                      <p className="text-sm text-gray-400">Education</p>
                      <p className="font-semibold text-white">{job.education}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                  {job.isActive ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400" />
                  )}
                  <div>
                    <p className="text-sm text-gray-400">Status</p>
                    <p className={`font-semibold ${job.isActive ? 'text-green-400' : 'text-red-400'}`}>
                      {job.isActive ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                </div>

                {job.workLocation && (
                  <div className="flex items-center gap-3 p-4 bg-gray-700 rounded-lg border border-gray-600 hover:border-gray-500 transition-colors">
                    <MapPin className="h-5 w-5 text-red-400" />
                    <div>
                      <p className="text-sm text-gray-400">Work Location</p>
                      <p className="font-semibold text-white">{job.workLocation}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {job.description && (
                <div className="border-t border-gray-700 pt-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Job Description</h4>
                  <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{job.description}</p>
                  </div>
                </div>
              )}

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <div className="border-t border-gray-700 pt-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Requirements</h4>
                  <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <ul className="list-disc list-inside space-y-2 text-gray-300">
                      {job.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Benefits */}
              {job.benefits && job.benefits.length > 0 && (
                <div className="border-t border-gray-700 pt-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Benefits</h4>
                  <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <ul className="list-disc list-inside space-y-2 text-gray-300">
                      {job.benefits.map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-400">Job not found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsModal;

