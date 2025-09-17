export interface CompanyResponse {
  id: string;
  companyName: string;
  email: string;
  industry?: string;
  size?: string;
  website?: string;
  description?: string;
  foundedYear?: number;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  contactPersonName?: string;
  contactPersonTitle?: string;
  contactPersonEmail?: string;
  contactPersonPhone?: string;
  isVerified: boolean;
  isBlocked: boolean;
  profileCompleted: boolean;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyAuthResponse {
  company: CompanyResponse;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface CompanyProfileStepResponse {
  profileStep: string;
}

export interface JobCountResponse{
  count: number;
  companyId: string;
}

export interface CompanyDashboardResponse{
  company: CompanyResponse;
  profileStep: CompanyProfileStepResponse | null;
  jobCount: number;
  applicationCount: number;

}