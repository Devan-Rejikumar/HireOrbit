export interface IEmailService {
  sendOTP(email: string, otp: number): Promise<void>;
  sendApprovalEmail(email: string, companyName: string): Promise<void>;
  sendRejectionEmail(email: string, companyName: string, reason: string): Promise<void>;
}
