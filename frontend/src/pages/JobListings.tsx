import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, MapPin, Briefcase, Filter, Eye, ChevronLeft, ChevronRight, X } from 'lucide-react';
import api from '../api/axios';
import { useLocation, Link } from 'react-router-dom';
import AutocompleteInput from '../components/AutocompleteInput';
import Header from '@/components/Header';
import JobApplicationModal from '../components/JobApplicationModal';
import type { ApplicationData } from '@/api/applicationService';

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
    total?: number;
    page?: number;
    limit?: number;
  };
  message: string;
}


const JobListings = () => {
  const location = useLocation();
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
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
  const [_quickSearch, _setQuickSearch] = useState('');
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 5;


  // Map frontend jobType values to database format
  const mapJobTypeToDatabase = (jobType: string): string => {
    const mapping: { [key: string]: string } = {
      'full-time': 'Full-time',
      'part-time': 'Part-time',
      'contract': 'Contract',
      'internship': 'Internship',
      'freelance': 'Freelance',
    };
    return mapping[jobType.toLowerCase()] || jobType;
  };

  // Check if multi-select filters are active (require client-side filtering)
  const hasMultiSelectFilters = searchFilters.experienceLevel.length > 0 || 
                                 searchFilters.education.length > 0 || 
                                 searchFilters.workLocation.length > 0;

  // Fetch jobs
  const fetchJobs = async () => {
    try {
      setLoading(true);
      setSearchError('');
      
      const params = new URLSearchParams();
      if (searchFilters.title) params.append('title', searchFilters.title);
      if (searchFilters.company) params.append('company', searchFilters.company);
      if (searchFilters.location) params.append('location', searchFilters.location);
      if (searchFilters.jobType) {
        // Map frontend format to database format
        const dbJobType = mapJobTypeToDatabase(searchFilters.jobType);
        params.append('jobType', dbJobType);
      }
      
      // If multi-select filters are active, fetch a large batch for client-side filtering
      // Otherwise, use backend pagination
      if (hasMultiSelectFilters) {
        // Fetch a large batch (100 jobs) to allow client-side filtering and pagination
        params.append('page', '1');
        params.append('limit', '100');
      } else {
        // Use backend pagination
        params.append('page', currentPage.toString());
        params.append('limit', jobsPerPage.toString());
      }
      
      const response = await api.get<JobsResponse>(`/jobs/search?${params.toString()}`);
      const jobsData = response.data?.data?.jobs || [];
      const total = response.data?.data?.total || 0;

      setAllJobs(jobsData);
      setTotalJobs(total);
    } catch (_error: unknown) {
      setSearchError('Failed to fetch jobs. Please try again.');
      setAllJobs([]);
      setTotalJobs(0);
    } finally {
      setLoading(false);
    }
  };

  // Apply client-side filters for experienceLevel, education, and workLocation
  // (These are multi-select filters, so we filter client-side)
  const filteredJobs = useMemo(() => {
    return allJobs.filter(job => {
      if (searchFilters.experienceLevel.length > 0) {
        const jobExperienceLevel = job.experienceLevel.toLowerCase();
        const hasMatchingExperience = searchFilters.experienceLevel.some(level => {
          const levelMapping: { [key: string]: string[] } = {
            'entry': ['entry level'],
            'mid': ['mid level'],
            'senior': ['senior level'],
            'executive': ['executive', 'lead/principal'],
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
            'none': ['no degree required'],
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
            'hybrid': ['hybrid'],
          };
          return locationMapping[location]?.some(match => jobWorkLocation.includes(match)) || false;
        });
        if (!hasMatchingLocation) return false;
      }

      return true;
    });
  }, [allJobs, searchFilters.experienceLevel, searchFilters.education, searchFilters.workLocation]);

  // Pagination logic:
  // - If multi-select filters are active: use client-side pagination on filtered results
  // - Otherwise: jobs are already paginated from backend
  const paginatedJobs = useMemo(() => {
    if (hasMultiSelectFilters) {
      // Client-side pagination for multi-select filters
      const startIndex = (currentPage - 1) * jobsPerPage;
      const endIndex = startIndex + jobsPerPage;
      return filteredJobs.slice(startIndex, endIndex);
    } else {
      // Backend pagination - jobs are already paginated
      return filteredJobs;
    }
  }, [filteredJobs, currentPage, jobsPerPage, hasMultiSelectFilters]);

  // Calculate total pages
  const effectiveTotal = hasMultiSelectFilters ? filteredJobs.length : totalJobs;
  const totalPages = Math.ceil(effectiveTotal / jobsPerPage);
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
      location: locationParam,
    }));
  }, [location.search]);
  // Reset to page 1 when filters change (except pagination)
  useEffect(() => {
    setCurrentPage(1);
  }, [searchFilters.title, searchFilters.company, searchFilters.location, searchFilters.jobType, searchFilters.experienceLevel, searchFilters.education, searchFilters.workLocation]);

  // Fetch jobs when filters or page changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchJobs();
    }, 500); 

    return () => clearTimeout(timeoutId);
  }, [searchFilters.title, searchFilters.company, searchFilters.location, searchFilters.jobType, searchFilters.experienceLevel, searchFilters.education, searchFilters.workLocation, currentPage]);

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

  const handleApplicationSubmit = useCallback((applicationData: ApplicationData) => {
    if (selectedJob) {
      setAllJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === selectedJob.id ? { ...job, hasApplied: true } : job,
        ),
      );
    }
    setShowApplicationModal(false);
    // Toast message is handled in JobApplicationModal component
  }, [selectedJob]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-800 pt-14 sm:pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center">Find Your Dream Job</h1>
          <p className="text-gray-200 mt-2 text-sm sm:text-base text-center">Discover opportunities that match your skills</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Search Card */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6 -mt-6 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Job Title</label>
              <AutocompleteInput
                value={searchFilters.title}
                onChange={(value) => setSearchFilters(prev => ({ ...prev, title: value }))}
                placeholder="e.g. Software Engineer"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Company</label>
              <AutocompleteInput
                value={searchFilters.company}
                onChange={(value) => setSearchFilters(prev => ({ ...prev, company: value }))}
                placeholder="e.g. Google"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Location</label>
              <AutocompleteInput
                value={searchFilters.location}
                onChange={(value) => setSearchFilters(prev => ({ ...prev, location: value }))}
                placeholder="e.g. New York"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Job Type</label>
              <select
                value={searchFilters.jobType}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, jobType: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
            <button
              onClick={handleSearch}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center font-medium shadow-md hover:shadow-lg"
            >
              <Search className="h-4 w-4 mr-2" />
              Search Jobs
            </button>
            {searchError && (
              <p className="text-red-600 text-xs sm:text-sm text-center sm:text-left">{searchError}</p>
            )}
          </div>
        </div>

        {/* Filter Sidebar Toggle for Mobile */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-gray-700 hover:text-gray-900 bg-white px-4 py-2.5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Filter className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Filters</span>
            {(searchFilters.experienceLevel.length > 0 || searchFilters.education.length > 0 || searchFilters.workLocation.length > 0 || searchFilters.jobType) && (
              <span className="ml-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center">
                {searchFilters.experienceLevel.length + searchFilters.education.length + searchFilters.workLocation.length + (searchFilters.jobType ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Filter Sidebar */}
          <div className={`w-full lg:w-1/4 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 sticky top-20 lg:top-24">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="lg:hidden text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4 sm:space-y-6">
                {/* Job Type Filter */}
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2 sm:mb-3">Job Type</h4>
                  <div className="space-y-1.5 sm:space-y-2">
                    {[
                      { value: 'full-time', label: 'Full Time' },
                      { value: 'part-time', label: 'Part Time' },
                      { value: 'contract', label: 'Contract' },
                      { value: 'internship', label: 'Internship' },
                    ].map((type) => (
                      <label key={type.value} className="flex items-center cursor-pointer group">
                        <input
                          type="checkbox"
                          value={type.value}
                          checked={searchFilters.jobType === type.value}
                          onChange={(e) => setSearchFilters(prev => ({ 
                            ...prev, 
                            jobType: e.target.checked ? e.target.value : '', 
                          }))}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-xs sm:text-sm text-gray-700 group-hover:text-gray-900">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Experience Level Filter */}
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2 sm:mb-3">Experience Level</h4>
                  <div className="space-y-1.5 sm:space-y-2">
                    {[
                      { value: 'entry', label: 'Entry (0-2 yrs)' },
                      { value: 'mid', label: 'Mid (3-5 yrs)' },
                      { value: 'senior', label: 'Senior (6-10 yrs)' },
                      { value: 'executive', label: 'Executive (10+ yrs)' },
                    ].map((level) => (
                      <label key={level.value} className="flex items-center cursor-pointer group">
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
                                : prev.experienceLevel.filter(item => item !== value),
                            }));
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-xs sm:text-sm text-gray-700 group-hover:text-gray-900">{level.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Work Location Filter */}
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2 sm:mb-3">Work Location</h4>
                  <div className="space-y-1.5 sm:space-y-2">
                    {[
                      { value: 'remote', label: 'Remote' },
                      { value: 'hybrid', label: 'Hybrid' },
                      { value: 'onsite', label: 'On-site' },
                    ].map((type) => (
                      <label key={type.value} className="flex items-center cursor-pointer group">
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
                                : prev.workLocation.filter(item => item !== value),
                            }));
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-xs sm:text-sm text-gray-700 group-hover:text-gray-900">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={clearFilters}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-xs sm:text-sm font-medium"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>

          {/* Job Listings */}
          <div className="w-full lg:w-3/4">
            <div className="space-y-3 sm:space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading jobs...</span>
                </div>
              ) : paginatedJobs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                  <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm sm:text-base">
                    {searchFilters.title || searchFilters.company || searchFilters.location || searchFilters.jobType 
                      ? 'No jobs found matching your search criteria' 
                      : 'Enter search criteria to find jobs'}
                  </p>
                </div>
              ) : (
                paginatedJobs.map((job) => (
                  <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-all duration-200">
                    {/* Job Header */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors truncate">
                          {job.title}
                        </h3>
                        {/* Company & Location */}
                        <div className="flex flex-wrap items-center text-gray-600 text-sm sm:text-base gap-x-4 gap-y-1 mb-3">
                          <div className="flex items-center">
                            <Briefcase className="h-4 w-4 mr-1.5 flex-shrink-0" />
                            <span className="font-medium truncate">{job.company}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1.5 flex-shrink-0" />
                            <span className="truncate">{job.location}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons - Desktop */}
                      <div className="hidden sm:flex flex-col space-y-2 flex-shrink-0">
                        <Link 
                          to={`/jobs/${job.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium flex items-center text-sm whitespace-nowrap"
                        >
                          <Eye className="h-4 w-4 mr-1.5" />
                          View Details
                        </Link>
                        <button
                          onClick={() => handleApply(job)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md"
                        >
                          Apply Now
                        </button>
                      </div>
                    </div>

                    {/* Tags - Responsive Grid */}
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
                      <span className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">
                        {job.jobType}
                      </span>
                      <span className="bg-green-100 text-green-800 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">
                        {job.experienceLevel}
                      </span>
                      <span className="bg-purple-100 text-purple-800 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium hidden xs:inline-block">
                        {job.education}
                      </span>
                      <span className="bg-orange-100 text-orange-800 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium">
                        {job.workLocation}
                      </span>
                    </div>

                    {/* Salary & Date */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3 text-xs sm:text-sm">
                      {job.salary && (
                        <span className="text-green-600 font-semibold">₹ {job.salary.toLocaleString()}</span>
                      )}
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-500">
                        Posted: {new Date(job.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{job.description}</p>
                
                    {/* Deadline */}
                    <div className="mb-3 text-xs sm:text-sm">
                      <span className="text-gray-600">
                        <strong>Deadline:</strong> {new Date(job.applicationDeadline).toLocaleDateString()}
                      </span>
                    </div>
                
                    {/* Requirements Tags */}
                    {job.requirements.length > 0 && (
                      <div className="mb-4">
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {job.requirements.slice(0, 3).map((req, index) => (
                            <span key={index} className="bg-gray-100 text-gray-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none">
                              {req}
                            </span>
                          ))}
                          {job.requirements.length > 3 && (
                            <span className="text-gray-500 text-xs sm:text-sm px-2 py-0.5">
                              +{job.requirements.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons - Mobile Only */}
                    <div className="flex sm:hidden gap-2 mt-4 pt-4 border-t border-gray-100">
                      <Link 
                        to={`/jobs/${job.id}`}
                        className="flex-1 text-center border border-blue-600 text-blue-600 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-50 transition-colors"
                      >
                        View Details
                      </Link>
                      <button
                        onClick={() => handleApply(job)}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 rounded-lg font-medium text-sm hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 sm:mt-8 flex justify-center">
                <nav className="flex items-center space-x-1 sm:space-x-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={!hasPreviousPage}
                    className="px-2 sm:px-4 py-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
                  >
                    <ChevronLeft className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>
              
                  <div className="flex space-x-1">
                    {/* Show limited pages on mobile */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // On mobile, show only current page and adjacent pages
                        const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
                        if (!isMobile || totalPages <= 5) return true;
                        return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                      })
                      .map((page, index, arr) => (
                        <React.Fragment key={page}>
                          {index > 0 && arr[index - 1] !== page - 1 && (
                            <span className="px-2 py-2 text-gray-400 text-sm">...</span>
                          )}
                          <button
                            onClick={() => handlePageChange(page)}
                            className={`px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium min-w-[32px] ${
                              page === currentPage
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {page}
                          </button>
                        </React.Fragment>
                      ))}
                  </div>
              
                  <button
                    onClick={handleNextPage}
                    disabled={!hasNextPage}
                    className="px-2 sm:px-4 py-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="h-4 w-4 sm:ml-1" />
                  </button>
                </nav>
              </div>
            )}

            {/* Results Summary */}
            {allJobs.length > 0 && (
              <div className="mt-3 sm:mt-4 text-center text-gray-500 text-xs sm:text-sm">
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