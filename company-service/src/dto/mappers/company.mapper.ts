import { Company } from '@prisma/client';
import { CompanyAuthResponse, CompanyDashboardResponse, CompanyProfileStepResponse, CompanyResponse } from '../responses/company.response';

export function mapCompanyToResponse(company: Company): CompanyResponse {
  return {
    id: company.id,
    companyName: company.companyName,
    email: company.email,
    industry: company.industry || undefined,
    size: company.size || undefined,
    website: company.website || undefined,
    description: company.description || undefined,
    foundedYear: company.foundedYear || undefined,
    headquarters: company.headquarters || undefined,
    linkedinUrl: company.linkedinUrl || undefined,
    logo: company.logo || undefined,
    phone: company.phone || undefined,
    businessType: company.businessType || undefined,
    contactPersonName: company.contactPersonName || undefined,
    contactPersonTitle: company.contactPersonTitle || undefined,
    contactPersonEmail: company.contactPersonEmail || undefined,
    contactPersonPhone: company.contactPersonPhone || undefined,
    address: company.address || undefined,
    city: company.city || undefined,
    state: company.state || undefined,
    country: company.country || undefined,
    isVerified: company.isVerified,
    isBlocked: company.isBlocked,
    profileCompleted: company.profileCompleted,
    rejectionReason: company.rejectionReason || undefined,
    reviewedAt: company.reviewedAt || undefined,
    reviewedBy: company.reviewedBy || undefined,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
  };
}

export function mapCompaniesToResponse(companies: Company[]): CompanyResponse[] {
  return companies.map(mapCompanyToResponse);
}

export function mapCompanyDashboardResponse(
  company: Company, 
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

export function mapCompanyToAuthResponse(company: Company, tokens: {accessToken: string; refreshToken: string}): CompanyAuthResponse {
  return {
    company: mapCompanyToResponse(company),
    tokens
  };
}