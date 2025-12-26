export interface CompanyApiResponse {
  success?: boolean;
  data?: {
    company?: {
      id?: string;
      companyName?: string;
      logo?: string;
      email?: string;
      [key: string]: unknown;
    };
  };
  company?: {
    id?: string;
    companyName?: string;
    logo?: string;
    email?: string;
    [key: string]: unknown;
  };
}

export interface ICompanyServiceClient {
  getCompanyById(companyId: string): Promise<CompanyApiResponse>;
}

