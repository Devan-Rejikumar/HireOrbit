import { injectable } from 'inversify';
import nodemailer from 'nodemailer';
import { AppConfig } from '../../config/app.config';

@injectable()
export class EmailService {
  private transporter = nodemailer.createTransport({
    host: AppConfig.SMTP_HOST,
    port: AppConfig.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });


  async sendOTP(email: string, otp: number): Promise<void> {
    console.log(`EmailService sendOTP called with email: ${email}, otp: ${otp}`);
    
    try {
      console.log(` OTP Code for ${email}: ${otp}`);

      const mailOptions = {
        from: AppConfig.SMTP_FROM,
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is: ${otp}`,
        html: `<p>Your OTP code is: <b>${otp}</b></p>`,
      };
      
      await this.transporter.sendMail(mailOptions);
      console.log(` [EmailService] Email sent successfully to ${email}`);
    } catch (error) {
      console.log(' [EmailService] Error in sendOTP:', error);
      throw error;
    }
  }

  async sendPasswordResetOTP(email: string, otp: number): Promise<void> {
    console.log(`[EmailService] sendPasswordResetOTP called with email: ${email}, otp: ${otp}`);
  
    try {
      const mailOptions = {
        from: AppConfig.SMTP_FROM,
        to: email,
        subject: 'Password Reset OTP',
        text: `Your password reset OTP code is: ${otp}. This OTP will expire in 15 minutes.`,
        html: `
        <h2>Password Reset Request</h2>
        <p>Your OTP for password reset is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 15 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] Password reset OTP sent successfully to ${email}`);
    } catch (error) {
      console.log('[EmailService] Error in sendPasswordResetOTP:', error);
      throw error;
    }
  }


}
