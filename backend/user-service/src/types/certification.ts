export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
  description?: string;
  certificate_file?: string;
}

export interface CreateCertificationRequest {
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
  description?: string;
  certificate_file?: string;
}

export interface UpdateCertificationRequest extends Partial<CreateCertificationRequest> {
  id: string;
}