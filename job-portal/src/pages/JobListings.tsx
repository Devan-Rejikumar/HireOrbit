import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, MapPin, Briefcase, Filter, Eye, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api/axios';
import { useLocation, Link } from 'react-router-dom';
import AutocompleteInput from '../components/AutocompleteInput';
import Header from '@/components/Header';
import JobApplicationModal from '../components/JobApplicationModal';

interface Job {
  id: string;
  title: string;
  description: string;
  company: string;
  companyId?: string;
  location: string;
  salary?: number;
  jobType: string;
  requirements: string[];
  benefits: string[];
  experienceLevel: string;
  education: string;
  applicationDeadline: string;
  workLocation: string;
  createdAt: string;
  hasApplied?: boolean;
}

interface JobsResponse {
  success: boolean;
  data: {
    jobs: Job[];
  };
  message: string;
}


const JobListings = () => {
  const location = useLocation();
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    title: '',
    company: '',
    location: '',
    jobType: '',
    experienceLevel: [] as string[],
    education: [] as string[],
    workLocation: [] as string[],
  });
  
  // Quick search functionality
  const [quickSearch, setQuickSearch] = useState('');
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 5;


  // Fetch jobs
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setSearchError('');
      
      const params = new URLSearchParams();
      if (searchFilters.title) params.append('title', searchFilters.title);
      if (searchFilters.company) params.append('company', searchFilters.company);
      if (searchFilters.location) params.append('location', searchFilters.location);
      if (searchFilters.jobType) params.append('jobType', searchFilters.jobType);
      const response = await api.get<JobsResponse>(`/jobs/search?${params.toString()}`);
      const jobsData = (response.data as any).data?.jobs || [];

      setAllJobs(jobsData);
      setCurrentPage(1);
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      setSearchError('Failed to fetch jobs. Please try again.');
      setAllJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = useMemo(() => {
    return allJobs.filter(job => {
      if (searchFilters.experienceLevel.length > 0) {
        const jobExperienceLevel = job.experienceLevel.toLowerCase();
        const hasMatchingExperience = searchFilters.experienceLevel.some(level => {
          const levelMapping: { [key: string]: string[] } = {
            'entry': ['entry level'],
            'mid': ['mid level'],
            'senior': ['senior level'],
            'executive': ['executive', 'lead/principal']
          };
          return levelMapping[level]?.some(match => jobExperienceLevel.includes(match)) || false;
        });
        if (!hasMatchingExperience) return false;
      }

      if (searchFilters.education.length > 0) {
        const jobEducation = job.education.toLowerCase();
        const hasMatchingEducation = searchFilters.education.some(edu => {
          const eduMapping: { [key: string]: string[] } = {
            'highschool': ['high school'],
            'associate': ['associate degree'],
            'bachelor': ['bachelor\'s degree', 'bachelor'],
            'master': ['master\'s degree', 'master'],
            'phd': ['phd'],
            'none': ['no degree required']
          };
          return eduMapping[edu]?.some(match => jobEducation.includes(match)) || false;
        });
        if (!hasMatchingEducation) return false;
      }

   
      if (searchFilters.workLocation.length > 0) {
        const jobWorkLocation = job.workLocation.toLowerCase();
        const hasMatchingLocation = searchFilters.workLocation.some(location => {
          const locationMapping: { [key: string]: string[] } = {
            'onsite': ['on-site'],
            'remote': ['remote'],
            'hybrid': ['hybrid']
          };
          return locationMapping[location]?.some(match => jobWorkLocation.includes(match)) || false;
        });
        if (!hasMatchingLocation) return false;
      }

      return true;
    });
  }, [allJobs, searchFilters.experienceLevel, searchFilters.education, searchFilters.workLocation]);

  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * jobsPerPage;
    const endIndex = startIndex + jobsPerPage;
    return filteredJobs.slice(startIndex, endIndex);
  }, [filteredJobs, currentPage, jobsPerPage]);

  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;


  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNextPage = useCallback(() => {
    if (hasNextPage) {
      handlePageChange(currentPage + 1);
    }
  }, [hasNextPage, currentPage, handlePageChange]);

  const handlePreviousPage = useCallback(() => {
    if (hasPreviousPage) {
      handlePageChange(currentPage - 1);
    }
  }, [hasPreviousPage, currentPage, handlePageChange]);

  const clearFilters = useCallback(() => {
    setSearchFilters({
      title: '',
      company: '',
      location: '',
      jobType: '',
      experienceLevel: [],
      education: [],
      workLocation: [],
    });
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const title = urlParams.get('title') || '';
    const locationParam = urlParams.get('location') || '';
    setSearchFilters(prev => ({
      ...prev,
      title,
      location: locationParam
    }));
  }, [location.search]);
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchJobs();
    }, 500); 

    return () => clearTimeout(timeoutId);
  }, [searchFilters.title, searchFilters.company, searchFilters.location, searchFilters.jobType, searchFilters.experienceLevel, searchFilters.education, searchFilters.workLocation]);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchFilters]);

  const handleSearch = useCallback(() => {
    if (!searchFilters.title && !searchFilters.company && !searchFilters.location && !searchFilters.jobType && !searchFilters.experienceLevel && !searchFilters.education && !searchFilters.workLocation) {
      setSearchError('Please enter at least one search criteria');
      return;
    }
    
    setSearchError(''); 
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchFilters]);

  const handleApply = useCallback((job: Job) => {
    setSelectedJob(job);
    setShowApplicationModal(true);
  }, []);

  const handleApplicationSubmit = useCallback((applicationData: any) => {
    if (selectedJob) {
      setAllJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === selectedJob.id ? { ...job, hasApplied: true } : job
        )
      );
    }

    toast.success('Job applied successfully! All the best! 🎉');
  }, [selectedJob]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Find Your Dream Job</h1>
          <p className="text-gray-600 mt-2">Discover opportunities that match your skills</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
              <AutocompleteInput
                value={searchFilters.title}
                onChange={(value) => setSearchFilters(prev => ({ ...prev, title: value }))}
                placeholder="e.g. Software Engineer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
              <AutocompleteInput
                value={searchFilters.company}
                onChange={(value) => setSearchFilters(prev => ({ ...prev, company: value }))}
                placeholder="e.g. Google"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <AutocompleteInput
                value={searchFilters.location}
                onChange={(value) => setSearchFilters(prev => ({ ...prev, location: value }))}
                placeholder="e.g. New York"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
              <select
                value={searchFilters.jobType}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, jobType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <button
              onClick={handleSearch}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <Search className="h-4 w-4 mr-2" />
              Search Jobs
            </button>
            {searchError && (
              <p className="text-red-600 text-sm">{searchError}</p>
            )}
          </div>
        </div>

        {/* Filter Sidebar Toggle for Mobile */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-gray-600 hover:text-gray-800 bg-white px-4 py-2 rounded-lg border border-gray-300"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {Object.values(searchFilters).some(filter => filter) && (
              <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                {Object.values(searchFilters).filter(filter => filter).length}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filter Sidebar */}
          <div className={`lg:w-1/4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Job Type Filter */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Job Type</h4>
                  <div className="space-y-2">
                    {[
                      { value: 'full-time', label: 'Full Time' },
                      { value: 'part-time', label: 'Part Time' },
                      { value: 'contract', label: 'Contract' },
                      { value: 'internship', label: 'Internship' }
                    ].map((type) => (
                      <label key={type.value} className="flex items-center">
                        <input
                          type="checkbox"
                          value={type.value}
                          checked={searchFilters.jobType === type.value}
                          onChange={(e) => setSearchFilters(prev => ({ 
                            ...prev, 
                            jobType: e.target.checked ? e.target.value : '' 
                          }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Experience Level Filter */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Experience Level</h4>
                  <div className="space-y-2">
                    {[
                      { value: 'entry', label: 'Entry Level (0-2 years)' },
                      { value: 'mid', label: 'Mid Level (3-5 years)' },
                      { value: 'senior', label: 'Senior Level (6-10 years)' },
                      { value: 'executive', label: 'Executive (10+ years)' }
                    ].map((level) => (
                      <label key={level.value} className="flex items-center">
                        <input
                          type="checkbox"
                          value={level.value}
                          checked={searchFilters.experienceLevel.includes(level.value)}
                          onChange={(e) => {
                            const value = e.target.value;
                            setSearchFilters(prev => ({
                              ...prev,
                              experienceLevel: e.target.checked
                                ? [...prev.experienceLevel, value]
                                : prev.experienceLevel.filter(item => item !== value)
                            }));
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{level.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Work Location Filter */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Work Location</h4>
                  <div className="space-y-2">
                    {[
                      { value: 'remote', label: 'Remote' },
                      { value: 'hybrid', label: 'Hybrid' },
                      { value: 'onsite', label: 'On-site' }
                    ].map((type) => (
                      <label key={type.value} className="flex items-center">
                        <input
                          type="checkbox"
                          value={type.value}
                          checked={searchFilters.workLocation.includes(type.value)}
                          onChange={(e) => {
                            const value = e.target.value;
                            setSearchFilters(prev => ({
                              ...prev,
                              workLocation: e.target.checked
                                ? [...prev.workLocation, value]
                                : prev.workLocation.filter(item => item !== value)
                            }));
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={clearFilters}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>

          {/* Job Listings */}
          <div className="lg:w-3/4">
            <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">Loading jobs...</div>
          ) : paginatedJobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchFilters.title || searchFilters.company || searchFilters.location || searchFilters.jobType 
                ? 'No jobs found matching your search criteria' 
                : 'Enter search criteria to find jobs'}
            </div>
          ) : (
            paginatedJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex items-center text-gray-600 mb-3">
                      <Briefcase className="h-4 w-4 mr-2" />
                      <span className="font-medium mr-4">{job.company}</span>
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {job.jobType}
                      </span>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        {job.experienceLevel}
                      </span>
                      <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                        {job.education}
                      </span>
                      <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                        {job.workLocation}
                      </span>
                      {job.salary && (
                        <span className="text-green-600 font-semibold">₹ {job.salary.toLocaleString()}</span>
                      )}
                      <span className="text-gray-500 text-sm">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>
                    
                    <div className="mb-4">
                      <span className="text-sm text-gray-600">
                        <strong>Application Deadline:</strong> {new Date(job.applicationDeadline).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {job.requirements.length > 0 && (
                      <div className="mb-6">
                        <div className="flex flex-wrap gap-2">
                          {job.requirements.slice(0, 4).map((req, index) => (
                            <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                              {req}
                            </span>
                          ))}
                          {job.requirements.length > 4 && (
                            <span className="text-gray-500 text-sm px-3 py-1">
                              +{job.requirements.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-6 flex flex-col space-y-3">
                    <Link 
                      to={`/jobs/${job.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Link>
                    <button
                      onClick={() => handleApply(job)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={handlePreviousPage}
                disabled={!hasPreviousPage}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </button>
              
              <div className="flex space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      page === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={handleNextPage}
                disabled={!hasNextPage}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </nav>
          </div>
        )}

        {/* Results Summary */}
        {allJobs.length > 0 && (
          <div className="mt-4 text-center text-gray-600 text-sm">
            Showing {Math.min((currentPage - 1) * jobsPerPage + 1, allJobs.length)}-{Math.min(currentPage * jobsPerPage, allJobs.length)} of {allJobs.length} jobs
          </div>
        )}
          </div>
        </div>
      </div>
      
      
      {/* Job Application Modal */}
      {selectedJob && (
        <JobApplicationModal
          isOpen={showApplicationModal}
          onClose={() => {
            setShowApplicationModal(false);
            setSelectedJob(null);
          }}
          jobId={selectedJob.id}
          jobTitle={selectedJob.title}
          companyName={selectedJob.company}
          companyId={selectedJob.companyId || selectedJob.company}
          onApplicationSubmit={handleApplicationSubmit}
        />
      )}
    </div>
  );
};

export default JobListings;