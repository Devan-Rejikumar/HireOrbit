export interface TimeSeriesDataPoint {
  date: string;
  count: number;
}

export interface TopCompany {
  companyId: string;
  companyName: string;
  jobCount: number;
}

export interface TopApplicant {
  userId: string;
  userName: string;
  userEmail: string;
  applicationCount: number;
}

export interface TopJob {
  jobId: string;
  jobTitle: string;
  companyName: string;
  applicationCount: number;
}

export interface DashboardStatisticsResponse {
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

export type TimeFilter = 'week' | 'month' | 'year';

