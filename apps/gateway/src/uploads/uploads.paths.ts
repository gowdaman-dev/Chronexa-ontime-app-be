import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const UPLOADS_CANDIDATES = [
  resolve(process.cwd(), 'uploads'),
  resolve(__dirname, '../../../../uploads'),
];

export function getUploadsRoot(): string {
  return UPLOADS_CANDIDATES.find((dir) => existsSync(dir)) ?? UPLOADS_CANDIDATES[0];
}

export function getManualPdfPath(): string {
  return join(getUploadsRoot(), 'manuals', 'manuals.pdf');
}
