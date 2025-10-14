import admin from 'firebase-admin';
import { FCMPayload } from '../types';

export async function sendCriticalAlert(
  deviceToken: string,
  payload: FCMPayload,
  platform: 'ios' | 'android'
): Promise<boolean> {
  const message: admin.messaging.Message = {
    token: deviceToken,
    notification: {
      title: `${payload.userName} needs support`,
      body: 'Emergency wellness alert - please check on them',
    },
    data: {
      type: 'CRISIS_ALERT',
      userName: payload.userName,
      crisisLevel: payload.crisisLevel,
      timestamp: payload.timestamp,
      userId: payload.userId,
      userPhone: payload.userPhone || '',
    },
    android: {
      priority: 'high',
      notification: {
        channelId: 'crisis_alerts',
        priority: 'max',
        sound: 'default',
        vibrationPattern: [0, 500, 500, 500],
        defaultVibrateTimings: false,
      },
    },
    apns: {
      payload: {
        aps: {
          sound: {
            critical: 1,
            name: 'default',
            volume: 1.0,
          },
          badge: 1,
          alert: {
            title: `${payload.userName} needs support`,
            body: 'Emergency wellness alert - please check on them',
          },
        },
      },
      headers: {
        'apns-priority': '10',
        'apns-push-type': 'alert',
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('FCM notification sent successfully:', response);
    return true;
  } catch (error: any) {
    console.error('FCM send error:', error);

    // Check if token is invalid and should be removed
    if (error.code === 'messaging/invalid-registration-token' ||
        error.code === 'messaging/registration-token-not-registered') {
      console.warn('Invalid device token detected:', deviceToken);
      // Token should be removed from database
      return false;
    }

    return false;
  }
}

export async function sendTestNotification(
  deviceToken: string,
  personName: string
): Promise<boolean> {
  const message: admin.messaging.Message = {
    token: deviceToken,
    notification: {
      title: 'Test Alert',
      body: `You're protecting ${personName}. This is a test notification.`,
    },
    data: {
      type: 'TEST_ALERT',
      timestamp: new Date().toISOString(),
    },
  };

  try {
    await admin.messaging().send(message);
    return true;
  } catch (error) {
    console.error('Test notification error:', error);
    return false;
  }
}
