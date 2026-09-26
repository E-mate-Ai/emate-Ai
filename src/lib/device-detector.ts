export interface DeviceInfo {
  os: string;
  browser: string;
  deviceType: 'desktop' | 'tablet' | 'mobile';
  deviceName: string;
}

export function detectDevice(): DeviceInfo {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  
  // Detect OS
  let os = 'Unknown OS';
  if (ua.indexOf('Win') > -1) os = 'Windows';
  else if (ua.indexOf('Mac') > -1) os = 'macOS';
  else if (ua.indexOf('Linux') > -1) os = 'Linux';
  else if (ua.indexOf('Android') > -1) os = 'Android';
  else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) os = 'iOS';

  // Detect Browser
  let browser = 'Unknown Browser';
  if (ua.indexOf('Chrome') > -1 && ua.indexOf('Chromium') < 0) browser = 'Chrome';
  else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') < 0) browser = 'Safari';
  else if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
  else if (ua.indexOf('Edge') > -1) browser = 'Edge';
  else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) browser = 'Opera';
  else if (ua.indexOf('Trident') > -1) browser = 'Internet Explorer';

  // Detect Device Type
  let deviceType: 'desktop' | 'tablet' | 'mobile' = 'desktop';
  if (/iPad|Android(?!.*Mobile)/.test(ua)) deviceType = 'tablet';
  else if (/iPhone|Android|Mobile|webOS|BlackBerry/.test(ua)) deviceType = 'mobile';

  // Generate device name
  let deviceName = 'My Device';
  if (deviceType === 'mobile') {
    if (ua.indexOf('iPhone') > -1) deviceName = 'iPhone';
    else if (ua.indexOf('Android') > -1) deviceName = 'Android Phone';
    else deviceName = 'Mobile Device';
  } else if (deviceType === 'tablet') {
    if (ua.indexOf('iPad') > -1) deviceName = 'iPad';
    else if (ua.indexOf('Android') > -1) deviceName = 'Android Tablet';
    else deviceName = 'Tablet';
  } else {
    if (ua.indexOf('Mac') > -1) deviceName = 'Mac';
    else if (ua.indexOf('Windows') > -1) deviceName = 'Windows PC';
    else if (ua.indexOf('Linux') > -1) deviceName = 'Linux Machine';
    else deviceName = 'Computer';
  }

  return { os, browser, deviceType, deviceName };
}

export function getDeviceDescription(device: DeviceInfo): string {
  return `${device.browser} · ${device.os} · Active Now`;
}
