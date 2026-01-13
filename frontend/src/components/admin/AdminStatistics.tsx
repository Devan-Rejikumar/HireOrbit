import React, { useState, useEffect, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import api from '@/api/axios';
import { subscriptionService } from '@/api/subscriptionService';
import { FiUsers, FiHome, FiBriefcase, FiFileText } from 'react-icons/fi';
import toast from 'react-hot-toast';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

type TimeFilter = 'week' | 'month' | 'year';

interface TimeSeriesDataPoint {
  date: string;
  count: number;
}

interface TopCompany {
  companyId: string;
  companyName: string;
  jobCount: number;
}

interface TopApplicant {
  userId: string;
  userName: string;
  userEmail: string;
  applicationCount: number;
}

interface TopJob {
  jobId: string;
  jobTitle: string;
  companyName: string;
  applicationCount: number;
}

interface DashboardStatistics {
  totalUsers: number;
  totalCompanies: number;
  totalJobs: number;
  totalApplications: number;
  userRegistrations: TimeSeriesDataPoint[];
  companyRegistrations: TimeSeriesDataPoint[];
  jobPostings: TimeSeriesDataPoint[];
  applicationSubmissions: TimeSeriesDataPoint[];
  topCompanies: TopCompany[];
  topApplicants: TopApplicant[];
  topJobs: TopJob[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

const AdminStatistics: React.FC = () => {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('month');
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<DashboardStatistics | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);

  const fetchStatistics = useCallback(async () => {
    try {
      setRefreshing(true);
          
      // Fetch dashboard statistics and revenue in parallel
      const [dashboardResponse, revenueResponse] = await Promise.all([
        api.get<{ success: boolean; data: DashboardStatistics }>(
          `/users/admin/dashboard/statistics?timeFilter=${timeFilter}`,
        ),
        subscriptionService.admin.getRevenueStatistics().catch(() => null), // Don't fail if revenue fetch fails
      ]);

      if (dashboardResponse.data.success && dashboardResponse.data.data) {
        setStatistics(dashboardResponse.data.data);
      }

      // Set revenue if available
      if (revenueResponse?.data?.statistics) {
        setTotalRevenue(revenueResponse.data.statistics.totalRevenue);
      }
    } catch (error: unknown) {
      const isAxiosError = error && typeof error === 'object' && 'response' in error;
      const axiosError = isAxiosError ? (error as { response?: { status?: number } }) : null;
          
      // Handle specific error types
      if (axiosError?.response?.status === 503) {
        toast.error('Some services are temporarily unavailable. Please try again in a moment.', {
          duration: 5000,
        });
      } else if (axiosError?.response?.status === 429) {
        toast.error('Too many requests. Please wait a moment before trying again.', {
          duration: 5000,
        });
      } else if (axiosError?.response?.status && axiosError.response.status >= 500) {
        toast.error('Server error. Please try again later.', {
          duration: 5000,
        });
      } else {
        toast.error('Failed to load statistics. Some data may be incomplete.', {
          duration: 4000,
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeFilter]);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  const formatDateLabel = (dateString: string): string => {
    try {
      // Backend returns dates in different formats based on grouping:
      // - Day: "YYYY-MM-DD"
      // - Month: "YYYY-MM" 
      // - Year: "YYYY" or "YYYY-MM" (we'll extract year)
      
      if (timeFilter === 'year') {
        // For year filter, show just the year (e.g., "2020", "2021", "2022")
        // Backend now returns just "YYYY" for year grouping
        if (dateString.length === 4 && /^\d{4}$/.test(dateString)) {
          return dateString; // Already just the year like "2020"
        }
        // Extract year from "YYYY-MM-DD" or "YYYY-MM" (fallback)
        const year = dateString.split('-')[0];
        return year;
      } else if (timeFilter === 'month') {
        // For month filter, show full month name (e.g., "January", "February", "March")
        const parts = dateString.split('-');
        if (parts.length >= 2) {
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1; // Month is 0-indexed in Date
          const date = new Date(year, month, 1);
          return date.toLocaleDateString('en-US', { month: 'long' }); // "January", "February", etc.
        }
        // Fallback if format is unexpected
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'long' });
      } else if (timeFilter === 'week') {
        // For week filter, show week information
        // Backend returns the start date of the week in "YYYY-MM-DD" format
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return dateString; // Invalid date, return as-is
        }
        // Calculate week number
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const daysSinceStart = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
        const weekNum = Math.ceil((daysSinceStart + startOfYear.getDay() + 1) / 7);
        const year = date.getFullYear();
        return `Week ${weekNum}`;
      } else {
        // Fallback: format as date
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch (error) {
      return dateString;
    }
  };

  const formatDateRange = (startDate: string, endDate: string): string => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } catch {
      return `${startDate} - ${endDate}`;
    }
  };

  const hasData = statistics && (
    (statistics.userRegistrations && statistics.userRegistrations.some(item => item.count > 0)) ||
    (statistics.companyRegistrations && statistics.companyRegistrations.some(item => item.count > 0))
  );

  // Combine all dates from both user and company registrations
  const getAllDates = () => {
    if (!statistics) return [];
    const dateSet = new Set<string>();
    if (statistics.userRegistrations) {
      statistics.userRegistrations.forEach(item => dateSet.add(item.date));
    }
    if (statistics.companyRegistrations) {
      statistics.companyRegistrations.forEach(item => dateSet.add(item.date));
    }
    return Array.from(dateSet).sort();
  };

  const chartData = statistics && hasData ? (() => {
    const allDates = getAllDates();
    const userMap = new Map(statistics.userRegistrations?.map(item => [item.date, item.count]) || []);
    const companyMap = new Map(statistics.companyRegistrations?.map(item => [item.date, item.count]) || []);

    return {
      labels: allDates.map(date => formatDateLabel(date)),
      datasets: [
        {
          label: 'Users',
          data: allDates.map(date => userMap.get(date) || 0),
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          borderColor: 'rgba(99, 102, 241, 1)',
          borderWidth: 1,
        },
        {
          label: 'Companies',
          data: allDates.map(date => companyMap.get(date) || 0),
          backgroundColor: 'rgba(168, 85, 247, 0.8)',
          borderColor: 'rgba(168, 85, 247, 1)',
          borderWidth: 1,
        },
      ],
    };
  })() : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#e5e7eb',
        },
      },
      title: {
        display: true,
        text: `Registrations Over Time (${timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)})`,
        color: '#e5e7eb',
        font: {
          size: 16,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#9ca3af',
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
      },
      y: {
        ticks: {
          color: '#9ca3af',
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Title and Time Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Admin Dashboard</h2>
        <div className="flex items-center gap-2 sm:gap-4">
          <label className="text-sm sm:text-base text-gray-300 font-medium">Time Period:</label>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
            className="bg-gray-800 text-white px-3 sm:px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
          >
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="year">Year</option>
          </select>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl border-l-4 border-blue-500 hover:bg-gray-750 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-400">Total Users</p>
              <p className="text-xl sm:text-3xl font-bold text-white mt-1 sm:mt-2">
                {statistics?.totalUsers.toLocaleString() || '0'}
              </p>
            </div>
            <FiUsers className="h-8 w-8 sm:h-10 sm:w-10 text-blue-400" />
          </div>
        </div>

        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl border-l-4 border-purple-500 hover:bg-gray-750 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-400">Total Companies</p>
              <p className="text-xl sm:text-3xl font-bold text-white mt-1 sm:mt-2">
                {statistics?.totalCompanies.toLocaleString() || '0'}
              </p>
            </div>
            <FiHome className="h-8 w-8 sm:h-10 sm:w-10 text-purple-400" />
          </div>
        </div>

        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl border-l-4 border-green-500 hover:bg-gray-750 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-400">Active Jobs</p>
              <p className="text-xl sm:text-3xl font-bold text-white mt-1 sm:mt-2">
                {statistics?.totalJobs.toLocaleString() || '0'}
              </p>
            </div>
            <FiBriefcase className="h-8 w-8 sm:h-10 sm:w-10 text-green-400" />
          </div>
        </div>

        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl border-l-4 border-yellow-500 hover:bg-gray-750 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-gray-400">Total Revenue</p>
              <p className="text-xl sm:text-3xl font-bold text-white mt-1 sm:mt-2">
                ₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <span className="text-2xl sm:text-4xl text-yellow-400 font-bold">₹</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      {chartData ? (
        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl">
          <div className="h-64 sm:h-80 lg:h-96">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      ) : statistics && statistics.dateRange ? (
        <div className="bg-gray-800 p-4 sm:p-8 rounded-lg text-center border border-gray-700">
          <p className="text-gray-300 text-base sm:text-lg mb-2">No registrations found</p>
          <p className="text-gray-400 text-xs sm:text-sm">
            No users or companies registered from {formatDateRange(statistics.dateRange.startDate, statistics.dateRange.endDate)}
          </p>
        </div>
      ) : null}

      {/* Top Companies, Top Applicants, and Top Jobs */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Top Companies */}
          <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl">
            <h3 className="text-base sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <FiHome className="text-purple-400" />
              Top 5 Companies
            </h3>
            {statistics.topCompanies && statistics.topCompanies.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {statistics.topCompanies.map((company, index) => (
                  <div key={company.companyId} className="flex items-center justify-between p-2 sm:p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-base">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium text-sm sm:text-base truncate">{company.companyName}</p>
                        <p className="text-gray-400 text-xs sm:text-sm">{company.jobCount} {company.jobCount === 1 ? 'job' : 'jobs'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4 text-sm">No companies found</p>
            )}
          </div>

          {/* Top Applicants */}
          <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl">
            <h3 className="text-base sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <FiUsers className="text-blue-400" />
              Top 5 Users
            </h3>
            {statistics.topApplicants && statistics.topApplicants.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {statistics.topApplicants.map((applicant, index) => (
                  <div key={applicant.userId} className="flex items-center justify-between p-2 sm:p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-base">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium text-sm sm:text-base truncate">{applicant.userName}</p>
                        <p className="text-gray-400 text-xs sm:text-sm truncate">{applicant.userEmail}</p>
                        <p className="text-gray-500 text-xs mt-0.5 sm:mt-1">{applicant.applicationCount} {applicant.applicationCount === 1 ? 'application' : 'applications'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4 text-sm">No applicants found</p>
            )}
          </div>

          {/* Top Jobs */}
          <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-xl md:col-span-2 lg:col-span-1">
            <h3 className="text-base sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
              <FiBriefcase className="text-green-400" />
              Top 5 Jobs
            </h3>
            {statistics.topJobs && statistics.topJobs.length > 0 ? (
              <div className="space-y-2 sm:space-y-3">
                {statistics.topJobs.map((job, index) => (
                  <div key={job.jobId} className="flex items-center justify-between p-2 sm:p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-base">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium text-sm sm:text-base truncate">{job.jobTitle}</p>
                        <p className="text-gray-400 text-xs sm:text-sm truncate">{job.companyName}</p>
                        <p className="text-gray-500 text-xs mt-0.5 sm:mt-1">{job.applicationCount} {job.applicationCount === 1 ? 'application' : 'applications'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4 text-sm">No jobs found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStatistics;

