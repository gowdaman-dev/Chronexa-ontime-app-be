const { ReportPdfService } = require('./report-pdf.service');

describe('ReportPdfService', () => {
  it('exposes htmlToPdfBuffer', () => {
    const service = new ReportPdfService({ error: jest.fn() });
    expect(typeof service.htmlToPdfBuffer).toBe('function');
  });
});
