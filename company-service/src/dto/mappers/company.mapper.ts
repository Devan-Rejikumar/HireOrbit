import { CompanyDashboardResponse, CompanyProfileStepResponse, CompanyResponse } from '../responses/company.response';

export function mapCompanyToResponse(company: {
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
}): CompanyResponse {
  return {
    id: company.id,
    companyName: company.companyName,
    email: company.email,
    industry: company.industry,
    size: company.size,
    website: company.website,
    description: company.description,
    foundedYear: company.foundedYear,
    phone: company.phone,
    address: company.address,
    city: company.city,
    state: company.state,
    country: company.country,
    contactPersonName: company.contactPersonName,
    contactPersonTitle: company.contactPersonTitle,
    contactPersonEmail: company.contactPersonEmail,
    contactPersonPhone: company.contactPersonPhone,
    isVerified: company.isVerified,
    isBlocked: company.isBlocked,
    profileCompleted: company.profileCompleted,
    rejectionReason: company.rejectionReason,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
  };
}

export function mapCompaniesToResponse(companies: Array<{
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
}>): CompanyResponse[] {
  return companies.map(mapCompanyToResponse);
}
export function mapCompanyDashboardResponse(
  company: {
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
  }, 
  profileStep: CompanyProfileStepResponse | null, 
  jobCount: number, 
  applicationCount: number,
): CompanyDashboardResponse {
  return {
    company: mapCompanyToResponse(company),
    profileStep,
    jobCount,
    applicationCount,
  };
}