import { NotFoundException } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { ManualController } from './manual.controller';
import * as uploadsPaths from './uploads.paths';

jest.mock('node:fs', () => ({
  existsSync: jest.fn(),
}));

describe('ManualController', () => {
  let controller: ManualController;
  let res: { download: jest.Mock };

  beforeEach(() => {
    controller = new ManualController();
    res = { download: jest.fn() };
    jest.spyOn(uploadsPaths, 'getManualPdfPath').mockReturnValue('P:/uploads/manuals/manuals.pdf');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('downloads manual PDF when file exists', () => {
    (existsSync as jest.Mock).mockReturnValue(true);

    controller.download(res as any);

    expect(res.download).toHaveBeenCalledWith(
      'P:/uploads/manuals/manuals.pdf',
      'chronexa-user-manual.pdf',
    );
  });

  it('throws 404 when manual file is missing', () => {
    (existsSync as jest.Mock).mockReturnValue(false);

    expect(() => controller.download(res as any)).toThrow(NotFoundException);
  });
});
