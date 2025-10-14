import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { DeviceRegistration } from '../types';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    alert('Must use physical device for Push Notifications');
    return null;
  }

  // Request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowCriticalAlerts: true, // Critical alerts for iOS
      },
    });
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Failed to get push notification permissions');
    return null;
  }

  // Get FCM token
  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push notification token:', token);

    // Configure Android notification channel for critical alerts
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('crisis_alerts', {
        name: 'Crisis Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 500, 500],
        sound: 'default',
        enableVibrate: true,
        enableLights: true,
        lightColor: '#FF0000',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: true, // Bypass Do Not Disturb
      });
    }

    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

export async function registerDeviceWithBackend(
  phoneNumber: string,
  personName: string,
  deviceToken: string
): Promise<boolean> {
  try {
    const platform = Platform.OS as 'ios' | 'android';

    const registration: DeviceRegistration = {
      phoneNumber,
      deviceToken,
      platform,
      personName,
    };

    const response = await axios.post(API_ENDPOINTS.REGISTER_DEVICE, registration);

    if (response.data.success) {
      console.log('Device registered successfully');
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error registering device:', error);
    return false;
  }
}

export async function acknowledgeNotification(
  notificationId: string,
  deviceToken: string
): Promise<void> {
  try {
    await axios.post(API_ENDPOINTS.ACK_NOTIFICATION, {
      notificationId,
      deviceToken,
    });
  } catch (error) {
    console.error('Error acknowledging notification:', error);
  }
}

export async function sendTestAlert(phoneNumber: string): Promise<boolean> {
  try {
    const response = await axios.post(API_ENDPOINTS.TEST_ALERT, {
      phoneNumber,
    });

    return response.data.success;
  } catch (error) {
    console.error('Error sending test alert:', error);
    return false;
  }
}

export function setupNotificationListeners(
  onCrisisAlert: (alert: any) => void
) {
  // Handle notifications received while app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received in foreground:', notification);
    const data = notification.request.content.data;

    if (data.type === 'CRISIS_ALERT') {
      onCrisisAlert(data);
    }
  });

  // Handle notification tap (when app is in background or closed)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification tapped:', response);
    const data = response.notification.request.content.data;

    if (data.type === 'CRISIS_ALERT') {
      onCrisisAlert(data);
    }
  });

  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}
