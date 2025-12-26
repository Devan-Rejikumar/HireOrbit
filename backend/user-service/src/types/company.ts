export interface Company {
    id: string;
    email: string;
    companyName: string;
    industry?: string;
    size?: string;
    website?: string;
    description?: string;
    logo?: string;
    foundedYear?: number;
    headquarters?: string;
    phone?: string;
    linkedinUrl?: string;
    businessType?: string;
    contactPersonName?: string;
    contactPersonTitle?: string;
    contactPersonEmail?: string;
    contactPersonPhone?: string;
    profileCompleted: boolean;
    isVerified: boolean;
    isBlocked: boolean;
    rejectionReason?: string;
    reviewedAt?: Date;
    reviewedBy?: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
export interface CompanyApprovalResponse {
    company: Company;
    message: string;
  }
  
export interface PendingCompaniesResponse {
    companies: Company[];
  }
  