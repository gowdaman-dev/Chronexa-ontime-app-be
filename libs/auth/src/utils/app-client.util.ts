export function isPostmanClient(userAgent?: string): boolean {
  return (userAgent ?? '').toLowerCase().includes('postman');
}

export function isMobileClient(userAgent?: string): boolean {
  const ua = (userAgent ?? '').toLowerCase();
  return ua.includes('dart/') || ua.includes('flutter') || ua.includes('okhttp');
}

export function getAppTypeFromUserAgent(userAgent?: string): string {
  const ua = userAgent ?? '';
  const appType = ua.split('dart/')[1];
  return appType ? appType : 'fieldtrack';
}
