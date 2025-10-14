import Constants from 'expo-constants';

export const API_URL = Constants.expoConfig?.extra?.notificationServiceUrl ||
                       'http://localhost:3001';

export const API_ENDPOINTS = {
  REGISTER_DEVICE: `${API_URL}/api/notifications/register-device`,
  ACK_NOTIFICATION: `${API_URL}/api/notifications/ack`,
  TEST_ALERT: `${API_URL}/api/notifications/test-alert`,
};
