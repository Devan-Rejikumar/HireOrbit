export interface ISettingsService {
  getSettings(): Promise<{
    id: string;
    logoUrl: string | null;
    companyName: string | null;
    aboutPage: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null>;
  
  updateLogo(logoUrl: string): Promise<{
    id: string;
    logoUrl: string | null;
    companyName: string | null;
    aboutPage: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  
  updateCompanyName(companyName: string): Promise<{
    id: string;
    logoUrl: string | null;
    companyName: string | null;
    aboutPage: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  
  updateAboutPage(aboutPage: string): Promise<{
    id: string;
    logoUrl: string | null;
    companyName: string | null;
    aboutPage: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  
  updateSettings(data: {
    logoUrl?: string | null;
    companyName?: string | null;
    aboutPage?: string | null;
  }): Promise<{
    id: string;
    logoUrl: string | null;
    companyName: string | null;
    aboutPage: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

