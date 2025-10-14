/**
 * Notification Service
 * Handles medication reminders and notifications
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Medication } from '../types/medication';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  /**
   * Request notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted');
        return false;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('medication-reminders', {
          name: 'Medication Reminders',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6B5FA8',
          sound: 'default',
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to request notification permissions:', error);
      return false;
    }
  }

  /**
   * Schedule medication reminders
   */
  async scheduleMedicationReminders(medication: Medication): Promise<string[]> {
    if (!medication.remindersEnabled) {
      return [];
    }

    try {
      const notificationIds: string[] = [];

      for (const time of medication.scheduledTimes) {
        const [hours, minutes] = time.split(':').map(Number);

        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: `Time to take ${medication.name}`,
            body: `${medication.dosage} ${medication.dosageUnit}${
              medication.instructions ? ` - ${medication.instructions}` : ''
            }`,
            data: {
              medicationId: medication.id,
              medicationName: medication.name,
              scheduledTime: time,
              type: 'medication_reminder',
            },
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.HIGH,
            categoryIdentifier: 'medication',
          },
          trigger: {
            hour: hours,
            minute: minutes,
            repeats: true,
          },
        });

        notificationIds.push(id);
        console.log(`Scheduled notification ${id} for ${medication.name} at ${time}`);
      }

      return notificationIds;
    } catch (error) {
      console.error('Failed to schedule medication reminders:', error);
      return [];
    }
  }

  /**
   * Cancel all notifications for a medication
   */
  async cancelMedicationReminders(medicationId: string): Promise<void> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

      for (const notification of scheduledNotifications) {
        if (
          notification.content.data?.medicationId === medicationId &&
          notification.content.data?.type === 'medication_reminder'
        ) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
          console.log(`Cancelled notification ${notification.identifier} for medication ${medicationId}`);
        }
      }
    } catch (error) {
      console.error('Failed to cancel medication reminders:', error);
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('Cancelled all scheduled notifications');
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Send immediate notification
   */
  async sendImmediateNotification(title: string, body: string, data?: any): Promise<string> {
    try {
      return await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
        },
        trigger: null, // Send immediately
      });
    } catch (error) {
      console.error('Failed to send immediate notification:', error);
      throw error;
    }
  }

  /**
   * Add notification listener
   */
  addNotificationListener(
    handler: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(handler);
  }

  /**
   * Add notification response listener (when user taps notification)
   */
  addNotificationResponseListener(
    handler: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(handler);
  }
}

export const notificationService = new NotificationService();
