import type { AuthUser } from '@app/auth';

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
