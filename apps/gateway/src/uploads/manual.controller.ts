import {
  Controller,
  Get,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { existsSync } from 'node:fs';
import { Public } from '@app/auth';
import { getManualPdfPath } from './uploads.paths';

@ApiTags('User Manual')
@Public()
@Controller({ path: 'manual', version: '1' })
export class ManualController {
  @Get('download')
  @ApiOperation({
    summary: 'Download user manual',
    description:
      'Downloads the Chronexa mobile app user manual as a PDF. No authentication required.',
  })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'PDF file download' })
  @ApiResponse({ status: 404, description: 'Manual file not found' })
  download(@Res() res: Response) {
    const filePath = getManualPdfPath();
    if (!existsSync(filePath)) {
      throw new NotFoundException('Manual not found');
    }

    return res.download(filePath, 'chronexa-user-manual.pdf');
  }
}
