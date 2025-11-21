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
      [key: string]: any;
    };
    title?: string;
    company?: string;
  };
  job?: {
    title?: string;
    company?: string;
    [key: string]: any;
  };
}

export interface CompanyApiResponse {
  data?: {
    company?: {
      companyName?: string;
      [key: string]: any;
    };
  };
  company?: {
    companyName?: string;
    [key: string]: any;
  };
}

