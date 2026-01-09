import { injectable } from 'inversify';
import PDFDocument from 'pdfkit';
import { Offer, CompanyOfferTemplate } from '@prisma/client';
import { IOfferPdfService } from '../interfaces/IOfferPdfService';
import { uploadOfferPdfToCloudinary } from '../../config/cloudinary';
import { logger } from '../../utils/logger';
import axios from 'axios';

interface DefaultTemplate {
  logoUrl: null;
  signatureUrl: null;
  brandColor: '#000000';
  fontFamily: 'Helvetica';
  headerText: null;
  introText: null;
  closingText: null;
  footerText: null;
}

@injectable()
export class OfferPdfService implements IOfferPdfService {
  private getDefaultTemplate(): DefaultTemplate {
    return {
      logoUrl: null,
      signatureUrl: null,
      brandColor: '#000000',
      fontFamily: 'Helvetica',
      headerText: null,
      introText: null,
      closingText: null,
      footerText: null,
    };
  }

  private async downloadImage(url: string): Promise<Buffer | null> {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      return Buffer.from(response.data);
    } catch (error) {
      logger.warn(`[OfferPdfService] Failed to download image from ${url}:`, error);
      return null;
    }
  }

  private resolveLogo(template: CompanyOfferTemplate | null, companyLogoUrl: string | null): string | null {
    if (template?.logoUrl) {
      return template.logoUrl;
    }
    if (companyLogoUrl) {
      return companyLogoUrl;
    }
    return null;
  }

  async generateOfferPdf(
    offer: Offer,
    candidateName: string,
    companyName: string,
    template?: CompanyOfferTemplate | null,
    companyLogoUrl?: string | null,
  ): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const effectiveTemplate = template || this.getDefaultTemplate();
        const brandColor = (template?.brandColor || effectiveTemplate.brandColor) || '#000000';
        const fontFamily = (template?.fontFamily || effectiveTemplate.fontFamily) || 'Helvetica';

        const doc = new PDFDocument({
          size: 'LETTER',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);
        doc.font(fontFamily);
        const logoUrl = this.resolveLogo(template ?? null, companyLogoUrl ?? null);
        if (logoUrl) {
          try {
            const logoBuffer = await this.downloadImage(logoUrl);
            if (logoBuffer) {
              const logoWidth = 200;
              const _logoHeight = (logoBuffer.length > 0) ? logoWidth * 0.5 : 50;
              const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
              const x = (pageWidth - logoWidth) / 2 + doc.page.margins.left;
              
              doc.image(logoBuffer, x, doc.y, { width: logoWidth, fit: [logoWidth, 100] });
              doc.moveDown(2);
            }
          } catch (error) {
            logger.warn('[OfferPdfService] Error adding logo, continuing without it:', error);
          }
        }
        const headerText = template?.headerText || 'OFFER LETTER';
        doc.fontSize(24).fillColor(brandColor as string).text(headerText, { align: 'center' });
        doc.fillColor('#000000'); 
        doc.moveDown(2);
        doc.fontSize(12).text(`Date: ${new Date(offer.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}`, { align: 'right' });
        doc.moveDown(2);
        doc.fontSize(14).text(`Dear ${candidateName},`, { align: 'left' });
        doc.moveDown();

        const introText = template?.introText || 
          `We are pleased to extend an offer of employment to you for the position of ${offer.jobTitle} at ${companyName}.`;
        doc.fontSize(12).text(introText, { align: 'justify' });
        doc.moveDown();
        doc.fontSize(16).fillColor(brandColor as string).text('OFFER DETAILS', { underline: true });
        doc.fillColor('#000000');
        doc.moveDown();

        const joiningDate = new Date(offer.joiningDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const expiryDate = new Date(offer.offerExpiryDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        doc.fontSize(12);
        doc.text(`Position: ${offer.jobTitle}`, { continued: false });
        doc.text(`CTC (Cost to Company): ₹${offer.ctc.toLocaleString('en-IN')}`, { continued: false });
        doc.text(`Joining Date: ${joiningDate}`, { continued: false });
        doc.text(`Location: ${offer.location}`, { continued: false });
        doc.text(`Offer Validity: ${expiryDate}`, { continued: false });
        doc.moveDown();
        if (offer.offerMessage) {
          doc.fontSize(14).fillColor(brandColor as string).text('ADDITIONAL INFORMATION', { underline: true });
          doc.fillColor('#000000');
          doc.moveDown();
          doc.fontSize(12).text(offer.offerMessage, { align: 'justify' });
          doc.moveDown();
        }
        doc.fontSize(14).fillColor(brandColor as string).text('TERMS AND CONDITIONS', { underline: true });
        doc.fillColor('#000000');
        doc.moveDown();
        doc.fontSize(11).text(
          'This offer is subject to your acceptance and is valid until the expiry date mentioned above. ' +
          'Please review all details carefully. If you have any questions, please contact our HR team.',
          { align: 'justify' },
        );
        doc.moveDown(2);

        const closingText = template?.closingText || 'Best regards,';
        doc.fontSize(12).text(closingText, { align: 'left' });
        doc.moveDown();
        
        const footerText = template?.footerText || `${companyName} HR Team`;
        doc.fontSize(12).text(footerText, { align: 'left' });
        doc.moveDown();

        if (template?.signatureUrl) {
          try {
            const signatureBuffer = await this.downloadImage(template.signatureUrl);
            if (signatureBuffer) {
              const signatureWidth = 150;
              const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
              const x = (pageWidth - signatureWidth) / 2 + doc.page.margins.left;
              
              doc.image(signatureBuffer, x, doc.y, { width: signatureWidth, fit: [signatureWidth, 80] });
              doc.moveDown();
            }
          } catch (error) {
            logger.warn('[OfferPdfService] Error adding signature, using text fallback:', error);
            doc.fontSize(10).text('_________________________', { align: 'left' });
            doc.fontSize(10).text('Authorized Signatory', { align: 'left' });
          }
        } else {
        
          doc.fontSize(10).text('_________________________', { align: 'left' });
          doc.fontSize(10).text('Authorized Signatory', { align: 'left' });
        }

        doc.end();
      } catch (error) {
        logger.error('[OfferPdfService] Error generating PDF:', error);
        reject(error);
      }
    });
  }

  async uploadPdfToCloudinary(pdfBuffer: Buffer, offerId: string): Promise<string> {
    try {
      const timestamp = Date.now();
      const publicId = `offer-letters/offer_${offerId}_${timestamp}`;

      await uploadOfferPdfToCloudinary(pdfBuffer, publicId);

      return publicId; 

    } catch (error) {
      logger.error('[OfferPdfService] Error uploading PDF to Cloudinary:', error);
      throw error;
    }
  }

  async generateAndUploadPdf(
    offer: Offer,
    candidateName: string,
    companyName: string,
    template?: CompanyOfferTemplate | null,
    companyLogoUrl?: string | null,
  ): Promise<string> {
    try {
      const pdfBuffer = await this.generateOfferPdf(offer, candidateName, companyName, template, companyLogoUrl);
      const publicId = await this.uploadPdfToCloudinary(pdfBuffer, offer.id);
      return publicId;
    } catch (error) {
      logger.error('[OfferPdfService] Error generating and uploading PDF:', error);
      throw error;
    }
  }
}
