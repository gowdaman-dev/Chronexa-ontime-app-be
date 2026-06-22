import type { AuthUser } from '@app/auth';
import type { Response } from 'express';
import { SelfServiceGatewayService } from './self-service.service';

export function toUserPayload(user: AuthUser) {
  return {
    userId: user.userId,
    employeeId: user.employeeId,
    login: user.login,
    role: user.role,
    employeeType: user.employeeType,
    isADUser: user.isADUser,
  };
}

export function serializeUploadFile(file: any) {
  if (!file) return file;
  return {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    bufferBase64: Buffer.isBuffer(file.buffer)
      ? file.buffer.toString('base64')
      : file.buffer,
  };
}

export async function renderSelfServiceReport(
  selfService: SelfServiceGatewayService,
  pattern: string,
  user: AuthUser,
  query: any,
  res: Response,
) {
  const result: any = await selfService.workflow(pattern, {
    user: toUserPayload(user),
    query,
  });
  const format = String(query?.format ?? 'json').toLowerCase();
  const period = pattern.split('.').pop() ?? 'report';
  if (format === 'pdf' && result?.pdfBase64) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${period}-attendance-report.pdf"`,
    );
    res.send(Buffer.from(result.pdfBase64, 'base64'));
    return;
  }
  if (format === 'html' && result?.html) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${period}-report.html"`,
    );
    res.send(result.html);
    return;
  }
  return result;
}
