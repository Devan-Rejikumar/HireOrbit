export interface ISettingsRepository {
  getSettings(): Promise<{
    id: string;
    logoUrl: string | null;
    companyName: string | null;
    aboutPage: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null>;
  
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

