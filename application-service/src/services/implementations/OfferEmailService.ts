import { injectable, inject } from 'inversify';
import nodemailer from 'nodemailer';
import { OfferLetter } from '@prisma/client';
import { IOfferEmailService } from '../interfaces/IOfferEmailService';
import { IEmailTemplateService } from '../interfaces/IEmailTemplateService';
import { IOfferPdfService } from '../interfaces/IOfferPdfService';
import { TYPES } from '../../config/types';
import { AppConfig } from '../../config/app.config';
import { logger } from '../../utils/logger';
import { AppError } from '../../utils/errors/AppError';
import { HttpStatusCode } from '../../enums/StatusCodes';

@injectable()
export class OfferEmailService implements IOfferEmailService {
  private _transporter: nodemailer.Transporter;

  constructor(
    @inject(TYPES.IEmailTemplateService) private _templateService: IEmailTemplateService,
    @inject(TYPES.IOfferPdfService) private _pdfService: IOfferPdfService,
  ) {
    this._transporter = nodemailer.createTransport({
      host: AppConfig.SMTP_HOST,
      port: AppConfig.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    });
  }

  async sendOfferEmail(offer: OfferLetter, candidateEmail: string): Promise<void> {
    try {
      // 1. Load template (company default or system default)
      let template = await this._templateService.getDefaultTemplate(offer.companyId, 'OFFER_LETTER');
      
      // If no company template, use system default
      if (!template) {
        template = this.getSystemDefaultTemplate();
      }

      // 2. Prepare placeholders
      const placeholders = await this.preparePlaceholders(offer);

      // 3. Render template
      const { subject, htmlBody, textBody } = this._templateService.renderTemplate(template, placeholders);

      // 4. Generate PDF
      let pdfBuffer: Buffer | null = null;
      try {
        pdfBuffer = await this._pdfService.generateOfferPdf(offer);
      } catch (error) {
        logger.error('[OfferEmailService] Error generating PDF:', error);
        // Continue without PDF - email will still be sent
      }

      // 5. Prepare email attachments
      const attachments: nodemailer.Attachment[] = [];
      if (pdfBuffer) {
        attachments.push({
          filename: `Offer_Letter_${offer.jobTitle.replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        });
      }

      // 6. Send email
      const mailOptions: nodemailer.SendMailOptions = {
        from: AppConfig.SMTP_FROM,
        to: candidateEmail,
        subject,
        html: htmlBody,
        text: textBody,
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      await this._transporter.sendMail(mailOptions);
      logger.info(`[OfferEmailService] Offer email sent successfully to ${candidateEmail} for offer ${offer.id}`);
    } catch (error) {
      logger.error('[OfferEmailService] Error sending offer email:', error);
      throw new AppError('Failed to send offer email', HttpStatusCode.INTERNAL_SERVER_ERROR);
    }
  }

  private async preparePlaceholders(offer: OfferLetter): Promise<Record<string, string>> {
    // These will be populated from user/job/company data via service clients
    // For now, using placeholder values
    const joiningDate = new Date(offer.joiningDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const expiryDate = new Date(offer.expiresAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const offerLink = `${AppConfig.OFFER_LINK_BASE_URL}/offers/${offer.offerToken}`;

    return {
      candidate_name: 'Candidate', // Will be fetched from user service
      candidate_first_name: 'Candidate', // Will be fetched from user service
      job_title: offer.jobTitle,
      company_name: 'Company', // Will be fetched from company service
      company_logo: '', // Will be fetched from company service
      offer_link: offerLink,
      joining_date: joiningDate,
      base_salary: offer.baseSalary ? offer.baseSalary.toFixed(2) : 'TBD',
      salary_currency: offer.salaryCurrency,
      work_location: offer.workLocation,
      work_mode: offer.workMode,
      expiry_date: expiryDate,
      offer_validity_days: AppConfig.OFFER_DEFAULT_VALIDITY_DAYS.toString(),
    };
  }

  private getSystemDefaultTemplate(): any {
    return {
      id: 'system-default',
      companyId: '',
      templateType: 'OFFER_LETTER',
      name: 'System Default Offer Template',
      subject: 'Job Offer: {{job_title}} at {{company_name}}',
      bodyHtml: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .offer-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4F46E5; }
            .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Congratulations, {{candidate_first_name}}!</h1>
            </div>
            <div class="content">
              <p>Dear {{candidate_name}},</p>
              <p>We are pleased to extend an offer for the position of <strong>{{job_title}}</strong> at {{company_name}}.</p>
              
              <div class="offer-details">
                <h3>Offer Details:</h3>
                <ul>
                  <li><strong>Position:</strong> {{job_title}}</li>
                  <li><strong>Base Salary:</strong> {{base_salary}} {{salary_currency}}</li>
                  <li><strong>Joining Date:</strong> {{joining_date}}</li>
                  <li><strong>Work Location:</strong> {{work_location}}</li>
                  <li><strong>Work Mode:</strong> {{work_mode}}</li>
                </ul>
              </div>
              
              <p>Please review the complete offer letter (attached) and respond by {{expiry_date}}.</p>
              
              <a href="{{offer_link}}" class="button">View & Respond to Offer</a>
              
              <p>If you have any questions, please don't hesitate to reach out.</p>
              
              <p>Best regards,<br>{{company_name}} Team</p>
            </div>
            <div class="footer">
              <p>This offer is valid until {{expiry_date}} ({{offer_validity_days}} days).</p>
            </div>
          </div>
        </body>
        </html>
      `,
      bodyText: `Dear {{candidate_name}},\n\nWe are pleased to extend an offer for the position of {{job_title}} at {{company_name}}.\n\nOffer Details:\n- Position: {{job_title}}\n- Base Salary: {{base_salary}} {{salary_currency}}\n- Joining Date: {{joining_date}}\n- Work Location: {{work_location}}\n- Work Mode: {{work_mode}}\n\nPlease review the complete offer letter (attached) and respond by {{expiry_date}}.\n\nView & Respond: {{offer_link}}\n\nBest regards,\n{{company_name}} Team`,
      isDefault: true,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

