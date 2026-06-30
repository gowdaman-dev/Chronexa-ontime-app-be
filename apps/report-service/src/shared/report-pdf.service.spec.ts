const { ReportPdfService } = require('./report-pdf.service');

describe('ReportPdfService', () => {
  it('is constructible', () => {
    const service = new ReportPdfService({ error: jest.fn() });
    expect(service).toBeDefined();
  });
});
