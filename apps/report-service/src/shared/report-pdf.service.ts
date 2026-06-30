import { Injectable } from '@nestjs/common';
import { AppLoggerService } from '@app/common';

@Injectable()
export class ReportPdfService {
  constructor(private readonly logger: AppLoggerService) {}

  async htmlToPdfBuffer(html: string): Promise<Buffer> {
    let browser: any;
    try {
      const { default: puppeteer } = await import('puppeteer');
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: { top: '16px', bottom: '16px', left: '12px', right: '12px' },
      });
      return Buffer.from(pdf);
    } catch (error) {
      this.logger.error('PDF generation failed', error);
      throw error;
    } finally {
      await browser?.close();
    }
  }
}
