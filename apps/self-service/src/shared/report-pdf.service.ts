import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@app/config';
import { AppLoggerService } from '@app/common';

@Injectable()
export class ReportPdfService implements OnModuleDestroy {
  private browserPromise: Promise<any> | null = null;

  constructor(
    private readonly logger: AppLoggerService,
    private readonly config: ConfigService,
  ) {}

  private getTimeoutMs() {
    return this.config.get<number>('puppeteerTimeoutMs') ?? 60_000;
  }

  private async getBrowser() {
    if (!this.browserPromise) {
      this.browserPromise = (async () => {
        const { default: puppeteer } = await import('puppeteer');
        return puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
          ],
        });
      })().catch((error) => {
        this.browserPromise = null;
        throw error;
      });
    }
    return this.browserPromise;
  }

  async htmlToPdfBuffer(html: string): Promise<Buffer> {
    let page: any;
    try {
      const browser = await this.getBrowser();
      page = await browser.newPage();
      page.setDefaultTimeout(this.getTimeoutMs());
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
      await page?.close().catch(() => undefined);
    }
  }

  async onModuleDestroy() {
    if (!this.browserPromise) return;
    try {
      const browser = await this.browserPromise;
      await browser.close();
    } catch (error) {
      this.logger.error('Failed to close Puppeteer browser', error);
    } finally {
      this.browserPromise = null;
    }
  }
}
