import React, { useState, useEffect, useMemo } from 'react';
import api from '@/api/axios';
import { FiBriefcase, FiSearch, FiFilter, FiTrash2, FiEye, FiToggleLeft, FiToggleRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import JobReportsModal, { ReportedJobData } from '@/components/admin/JobReportsModal';

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
}

interface Company {
  id: string;
  companyName: string;
}

interface ReportedJob {
  job: Job;
  reports: Array<{
    id: string;
    jobId: string;
    userId: string;
    reason: string;
    createdAt: string;
  }>;
  reportCount: number;
}

const AdminJobManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState<'all' | 'reported'>('all');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [reportedJobs, setReportedJobs] = useState<ReportedJob[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReported, setLoadingReported] = useState(false);
  const [filterCompany, setFilterCompany] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [togglingJobId, setTogglingJobId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ jobId: string; jobTitle: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const itemsPerPage = 10;
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [selectedJobReports, setSelectedJobReports] = useState<ReportedJobData | null>(null);
  const [searchTermReported, setSearchTermReported] = useState('');
  const [currentPageReported, setCurrentPageReported] = useState(1);
  const itemsPerPageReported = 10;

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filters or search change
  }, [filterCompany, filterStatus, searchTerm]);

  useEffect(() => {
    setCurrentPageReported(1); // Reset to page 1 when search changes for reported jobs
  }, [searchTermReported]);

  useEffect(() => {
    if (viewMode === 'all') {
      fetchJobs();
    } else {
      fetchReportedJobs();
    }
  }, [filterCompany, filterStatus, currentPage, viewMode]);

  const fetchCompanies = async () => {
    try {
      const response = await api.get<{ data: { companies: Company[] } }>('/company/admin/all');
      const companyList = response.data?.data?.companies || [];
      setCompanies(companyList);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      interface JobQueryParams {
        page: number;
        limit: number;
        isActive?: boolean;
        search?: string;
      }
      const params: JobQueryParams = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (filterStatus !== 'all') {
        params.isActive = filterStatus === 'active';
      }

      if (filterCompany !== 'all') {
        params.companyId = filterCompany;
      }

      const response = await api.get<{ data: { jobs: Job[]; total: number } }>('/jobs/search', { params });
      const jobsList = response.data?.data?.jobs || [];
      const total = response.data?.data?.total || 0;
      
      setJobs(jobsList);
      setTotalJobs(total);
      setTotalPages(Math.ceil(total / itemsPerPage));
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchReportedJobs = async () => {
    try {
      setLoadingReported(true);
      const response = await api.get<{ data: { reportedJobs: ReportedJob[] } }>('/jobs/admin/reported');
      const reportedJobsList = response.data?.data?.reportedJobs || [];
      setReportedJobs(reportedJobsList);
    } catch (error: unknown) {
      console.error('Error fetching reported jobs:', error);
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const axiosError = isAxiosError ? (error as { response?: { data?: { error?: string } } }) : null;
      toast.error(axiosError?.response?.data?.error || 'Failed to fetch reported jobs');
    } finally {
      setLoadingReported(false);
    }
  };

  const handleDeleteJob = (jobId: string, jobTitle: string) => {
    setConfirmDelete({ jobId, jobTitle });
  };

  const confirmDeleteJob = async () => {
    if (!confirmDelete) return;

    try {
      setDeletingJobId(confirmDelete.jobId);
      await api.delete(`/jobs/${confirmDelete.jobId}`);
      toast.success('Job deleted successfully');
      setConfirmDelete(null);
      if (viewMode === 'all') {
        fetchJobs();
      } else {
        fetchReportedJobs();
      }
    } catch (error: unknown) {
      console.error('Error deleting job:', error);
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const axiosError = isAxiosError ? (error as { response?: { data?: { message?: string } } }) : null;
      toast.error(axiosError?.response?.data?.message || 'Failed to delete job');
    } finally {
      setDeletingJobId(null);
    }
  };

  const cancelDelete = () => {
    setConfirmDelete(null);
  };

  const handleToggleActive = async (job: Job) => {
    try {
      setTogglingJobId(job.id);
      await api.put(`/jobs/${job.id}`, {
        isActive: !job.isActive,
      });
      toast.success(`Job ${job.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchJobs();
    } catch (error: unknown) {
      console.error('Error toggling job status:', error);
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const axiosError = isAxiosError ? (error as { response?: { data?: { message?: string } } }) : null;
      toast.error(axiosError?.response?.data?.message || 'Failed to update job status');
    } finally {
      setTogglingJobId(null);
    }
  };

  const filteredJobs = useMemo(() => {
    if (!searchTerm) return jobs;

    const searchLower = searchTerm.toLowerCase();
    return jobs.filter(
      (job) =>
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.location.toLowerCase().includes(searchLower)
    );
  }, [jobs, searchTerm]);

  const filteredReportedJobs = useMemo(() => {
    if (!searchTermReported) return reportedJobs;

    const searchLower = searchTermReported.toLowerCase();
    return reportedJobs.filter((reportedJob) => {
      const job = reportedJob.job;
      const latestReport = reportedJob.reports[0];
      return (
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.location.toLowerCase().includes(searchLower) ||
        (latestReport?.reason?.toLowerCase().includes(searchLower) ?? false)
      );
    });
  }, [reportedJobs, searchTermReported]);

  const paginatedReportedJobs = useMemo(() => {
    const startIndex = (currentPageReported - 1) * itemsPerPageReported;
    const endIndex = startIndex + itemsPerPageReported;
    return filteredReportedJobs.slice(startIndex, endIndex);
  }, [filteredReportedJobs, currentPageReported]);

  const totalPagesReported = Math.ceil(filteredReportedJobs.length / itemsPerPageReported);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatSalary = (salary?: number) => {
    if (!salary) return 'Not specified';
    return `₹${salary.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Job Management</h1>
          <p className="text-gray-400 text-sm">Manage and monitor all job listings</p>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <FiBriefcase className="h-5 w-5" />
          <span className="text-base font-semibold">
            {viewMode === 'all' ? filteredJobs.length : filteredReportedJobs.length} {viewMode === 'all' ? 'Jobs' : 'Reported Jobs'}
          </span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-gray-700 flex-shrink-0">
        <button
          onClick={() => setViewMode('all')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            viewMode === 'all'
              ? 'text-purple-400 border-purple-400'
              : 'text-gray-400 border-transparent hover:text-gray-300'
          }`}
        >
          All Jobs
        </button>
        <button
          onClick={() => setViewMode('reported')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
            viewMode === 'reported'
              ? 'text-purple-400 border-purple-400'
              : 'text-gray-400 border-transparent hover:text-gray-300'
          }`}
        >
          Reported Jobs
        </button>
      </div>

      {/* Filters - Only show for All Jobs view */}
      {viewMode === 'all' && (
        <div className="bg-gray-800 rounded-lg p-3 flex-shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* Company Filter */}
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-400 h-4 w-4" />
            <select
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="px-3 py-1.5 text-sm bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.companyName}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 text-sm bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          </div>
        </div>
      )}

      {/* Jobs Table - All Jobs View */}
      {viewMode === 'all' && (
        <>
          {loading ? (
            <div className="flex items-center justify-center py-12 flex-1">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-12 text-center flex-1 flex items-center justify-center">
              <div>
                <FiBriefcase className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No jobs found</p>
              </div>
            </div>
          ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden flex-1 flex flex-col min-h-0">
          <div className="overflow-auto flex-1">
            <table className="w-full">
              <thead className="bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Job Title
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-750 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-white">{job.title}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-300">{job.company}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-300">{job.location}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium bg-purple-900 text-purple-200 rounded">
                        {job.jobType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(job)}
                        disabled={togglingJobId === job.id}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                          job.isActive
                            ? 'bg-green-900 text-green-200 hover:bg-green-800'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        } ${togglingJobId === job.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {job.isActive ? (
                          <>
                            <FiToggleRight className="h-3.5 w-3.5" />
                            Active
                          </>
                        ) : (
                          <>
                            <FiToggleLeft className="h-3.5 w-3.5" />
                            Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => window.open(`/jobs/${job.id}`, '_blank')}
                          className="text-purple-400 hover:text-purple-300 transition-colors"
                          title="View Job"
                        >
                          <FiEye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job.id, job.title)}
                          disabled={deletingJobId === job.id}
                          className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete Job"
                        >
                          {deletingJobId === job.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-400"></div>
                          ) : (
                            <FiTrash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
          )}

      {/* Pagination - All Jobs */}
      {viewMode === 'all' && !loading && filteredJobs.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between bg-gray-800 rounded-lg p-3 flex-shrink-0">
          <div className="text-xs text-gray-400">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalJobs)} of {totalJobs} jobs
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1.5 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <FiChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-2.5 py-1.5 text-sm rounded-lg transition-colors ${
                      currentPage === pageNum
                        ? 'bg-purple-600 text-white font-semibold'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-1.5 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              Next
              <FiChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
        </>
      )}

      {/* Reported Jobs Table */}
      {viewMode === 'reported' && (
        <>
          {/* Search for Reported Jobs */}
          <div className="bg-gray-800 rounded-lg p-3 flex-shrink-0">
            <div className="flex items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search reported jobs..."
                    value={searchTermReported}
                    onChange={(e) => setSearchTermReported(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {loadingReported ? (
            <div className="flex items-center justify-center py-12 flex-1">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : filteredReportedJobs.length === 0 ? (
            <div className="bg-gray-800 rounded-lg p-12 text-center flex-1 flex items-center justify-center">
              <div>
                <FiBriefcase className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">
                  {searchTermReported ? 'No reported jobs match your search' : 'No reported jobs found'}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg overflow-hidden flex-1 flex flex-col min-h-0">
              <div className="overflow-auto flex-1">
                <table className="w-full">
                  <thead className="bg-gray-700 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Job Title
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Report Reason
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Reports
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {paginatedReportedJobs.map((reportedJob) => {
                      const latestReport = reportedJob.reports[0];
                      return (
                        <tr key={reportedJob.job.id} className="hover:bg-gray-750 transition-colors">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-white">{reportedJob.job.title}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-300">{reportedJob.job.company}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-300">{reportedJob.job.location}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-gray-300 max-w-xs truncate" title={latestReport?.reason}>
                              {latestReport?.reason || '-'}
                            </div>
                            {reportedJob.reportCount > 1 && (
                              <div className="text-xs text-gray-500 mt-1">
                                +{reportedJob.reportCount - 1} more {reportedJob.reportCount - 1 === 1 ? 'reason' : 'reasons'}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                setSelectedJobReports({
                                  job: {
                                    id: reportedJob.job.id,
                                    title: reportedJob.job.title,
                                    company: reportedJob.job.company,
                                    location: reportedJob.job.location,
                                  },
                                  reports: reportedJob.reports,
                                  reportCount: reportedJob.reportCount,
                                });
                                setShowReportsModal(true);
                              }}
                              className="px-2 py-1 text-xs font-medium bg-red-900 text-red-200 rounded hover:bg-red-800 transition-colors cursor-pointer"
                              title="Click to view all reports"
                            >
                              {reportedJob.reportCount} {reportedJob.reportCount === 1 ? 'Report' : 'Reports'}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => window.open(`/jobs/${reportedJob.job.id}`, '_blank')}
                                className="text-purple-400 hover:text-purple-300 transition-colors"
                                title="View Job"
                              >
                                <FiEye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteJob(reportedJob.job.id, reportedJob.job.title)}
                                disabled={deletingJobId === reportedJob.job.id}
                                className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete Job"
                              >
                                {deletingJobId === reportedJob.job.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-400"></div>
                                ) : (
                                  <FiTrash2 className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination - Reported Jobs */}
          {!loadingReported && filteredReportedJobs.length > 0 && totalPagesReported > 1 && (
            <div className="flex items-center justify-between bg-gray-800 rounded-lg p-3 flex-shrink-0">
              <div className="text-xs text-gray-400">
                Showing {(currentPageReported - 1) * itemsPerPageReported + 1} to{' '}
                {Math.min(currentPageReported * itemsPerPageReported, filteredReportedJobs.length)} of{' '}
                {filteredReportedJobs.length} reported jobs
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPageReported((prev) => Math.max(1, prev - 1))}
                  disabled={currentPageReported === 1}
                  className="px-2 py-1.5 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <FiChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPagesReported) }, (_, i) => {
                    let pageNum: number;
                    if (totalPagesReported <= 5) {
                      pageNum = i + 1;
                    } else if (currentPageReported <= 3) {
                      pageNum = i + 1;
                    } else if (currentPageReported >= totalPagesReported - 2) {
                      pageNum = totalPagesReported - 4 + i;
                    } else {
                      pageNum = currentPageReported - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPageReported(pageNum)}
                        className={`px-2.5 py-1.5 text-sm rounded-lg transition-colors ${
                          currentPageReported === pageNum
                            ? 'bg-purple-600 text-white font-semibold'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPageReported((prev) => Math.min(totalPagesReported, prev + 1))}
                  disabled={currentPageReported === totalPagesReported}
                  className="px-2 py-1.5 text-sm bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  Next
                  <FiChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-900 rounded-full flex items-center justify-center">
                <FiTrash2 className="h-6 w-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">Delete Job</h3>
                <p className="text-sm text-gray-400 mt-1">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300">
                Are you sure you want to delete <span className="font-semibold text-white">&quot;{confirmDelete.jobTitle}&quot;</span>?
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={cancelDelete}
                disabled={deletingJobId === confirmDelete.jobId}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteJob}
                disabled={deletingJobId === confirmDelete.jobId}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deletingJobId === confirmDelete.jobId ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2 className="h-4 w-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Job Reports Modal */}
      <JobReportsModal
        isOpen={showReportsModal}
        onClose={() => {
          setShowReportsModal(false);
          setSelectedJobReports(null);
        }}
        reportedJob={selectedJobReports}
      />
    </div>
  );
};

export default AdminJobManagement;

