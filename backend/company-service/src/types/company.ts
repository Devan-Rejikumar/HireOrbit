export interface CompanyProfileData {
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
    profileCompleted?: boolean;
    rejectionReason?: string | null;
    reviewedAt?: Date | null;
    reviewedBy?: string | null;
  }
  
export interface CompanyProfileStepData {
    basicInfoCompleted: boolean;
    companyDetailsCompleted: boolean;
    contactInfoCompleted: boolean;
    currentStep: number;
  }
  
export interface CompanyRegistrationStep1 {
    email: string;
    password: string;
    companyName: string;
  }
  
export interface CompanyRegistrationStep2 {
    industry: string;
    size: string;
    website?: string;
    description: string;
    headquarters?: string;
    // Optional fields
    foundedYear?: number;
    phone?: string;
    linkedinUrl?: string;
    businessType?: string;
    logo?: string;
  }
  
export interface CompanyRegistrationStep3 {
    contactPersonName: string;
    contactPersonTitle: string;
    contactPersonEmail: string;
    contactPersonPhone: string;
  }

export interface CompanyProfileStep {
    id: string;
    companyId: string;
    basicInfoCompleted: boolean;
    companyDetailsCompleted: boolean;
    contactInfoCompleted: boolean;
    currentStep: number;
    createdAt: Date;
    updatedAt: Date;
  }