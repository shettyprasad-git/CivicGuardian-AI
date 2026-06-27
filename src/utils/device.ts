export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('civic_guardian_device_id');
  if (!deviceId) {
    deviceId = `device_${crypto.randomUUID()}`;
    localStorage.setItem('civic_guardian_device_id', deviceId);
  }
  return deviceId;
};
