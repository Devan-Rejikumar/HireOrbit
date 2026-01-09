export interface UserApiResponse {
  data?: {
    user?: {
      id?: string;
      name?: string;
      username?: string;
      email?: string;
      role?: string;
      phone?: string;
      profile?: unknown;
    };
  };
}

export interface JobApiResponse {
  success?: boolean;
  data?: {
    job?: {
      id?: string;
      title?: string;
      company?: string;
      companyId?: string;
      description?: string;
      location?: string;
      applicationDeadline?: string | Date;
      [key: string]: unknown;
    };
    title?: string;
    company?: string;
  };
  job?: {
    title?: string;
    company?: string;
    [key: string]: unknown;
  };
}

export interface CompanyApiResponse {
  data?: {
    company?: {
      companyName?: string;
      [key: string]: unknown;
    };
  };
  company?: {
    companyName?: string;
    [key: string]: unknown;
  };
}

