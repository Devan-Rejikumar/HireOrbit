import { injectable } from 'inversify';
import nodemailer from 'nodemailer';
import { IEmailService } from '../interface/IEmailService';

@injectable()
export class EmailService implements IEmailService {
  constructor(){
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
  }
  private _transporter = nodemailer.createTransport({
    
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, 
    auth: {
      user: process.env.SMTP_USER || 'your@email.com',
      pass: process.env.SMTP_PASS || 'yourpassword',
    },
  });

  async sendOTP(email: string, otp: number): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Company Service" <no-reply@company.com>',
      to: email,
      subject: 'Your Company OTP Code',
      text: `Your OTP code is: ${otp}`,
      html: `<p>Your OTP code is: <b>${otp}</b></p>`,
    };

    await this._transporter.sendMail(mailOptions);
  }

  async sendApprovalEmail(email: string, companyName: string): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Job Portal" <no-reply@jobportal.com>',
      to: email,
      subject: 'Company Application Approved! 🎉',
      text: `Congratulations ${companyName}! Your company has been approved and you can now start posting jobs.`,
      html: `
      <h2>Congratulations ${companyName}! 🎉</h2>
      <p>Your company application has been <strong>approved</strong>!</p>
      <p>You can now:</p>
      <ul>
        <li>Post job openings</li>
        <li>Manage applications</li>
        <li>Access your company dashboard</li>
      </ul>
      <p>Welcome to our job portal!</p>
    `,
    };
    await this._transporter.sendMail(mailOptions);
  }

  async sendRejectionEmail(email: string, companyName: string, reason: string): Promise<void> {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Job Portal" <no-reply@jobportal.com>',
      to: email,
      subject: 'Company Application Update',
      text: `Dear ${companyName}, unfortunately your company application was not approved. Reason: ${reason}`,
      html: `
      <h2>Company Application Update</h2>
      <p>Dear ${companyName},</p>
      <p>Unfortunately, your company application was not approved at this time.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>You can update your company profile and resubmit for review.</p>
      <p>If you have questions, please contact our support team.</p>
    `,
    };
    await this._transporter.sendMail(mailOptions);
  }

}