import {
  getAppTypeFromUserAgent,
  isMobileClient,
  isPostmanClient,
} from './app-client.util';

describe('app-client.util', () => {
  it('detects postman clients', () => {
    expect(isPostmanClient('PostmanRuntime/7.32.3')).toBe(true);
  });

  it('detects mobile clients', () => {
    expect(isMobileClient('dart/ontime')).toBe(true);
    expect(isMobileClient('okhttp/4.9')).toBe(true);
  });

  it('reads app type from dart user agent', () => {
    expect(getAppTypeFromUserAgent('dart/ontime')).toBe('ontime');
    expect(getAppTypeFromUserAgent('Mozilla/5.0')).toBe('fieldtrack');
  });
});
