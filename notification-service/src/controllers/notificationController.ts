import { Request, Response } from 'express';
import Joi from 'joi';
import { sendCriticalAlert, sendTestNotification } from '../services/fcmService';
import {
  registerDevice as registerDeviceService,
  getDevicesByPhones,
  updateDeviceLastActive,
  removeInvalidDevice,
} from '../services/deviceService';
import {
  saveCrisisNotification,
  updateNotificationStatus,
  getNotificationsByUser as getNotificationsByUserService,
  acknowledgeNotification as acknowledgeNotificationService,
} from '../services/notificationService';
import { CrisisAlertPayload, DeviceRegistration, NotificationAck } from '../types';

// Validation schemas
const crisisAlertSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  userName: Joi.string().required(),
  crisisLevel: Joi.string().valid('moderate', 'high', 'critical').required(),
  emergencyContacts: Joi.array().items(
    Joi.object({
      phoneNumber: Joi.string().required(),
      name: Joi.string().required(),
      priority: Joi.number().min(1).max(10).required(),
    })
  ).min(1).required(),
});

const deviceRegistrationSchema = Joi.object({
  phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  deviceToken: Joi.string().required(),
  platform: Joi.string().valid('ios', 'android').required(),
  personName: Joi.string().required(),
});

const notificationAckSchema = Joi.object({
  notificationId: Joi.string().uuid().required(),
  deviceToken: Joi.string().required(),
});

export async function sendCrisisAlert(req: Request, res: Response) {
  try {
    // Validate request body
    const { error, value } = crisisAlertSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const payload: CrisisAlertPayload = value;

    // Sort contacts by priority (1 = highest)
    const sortedContacts = payload.emergencyContacts.sort((a, b) => a.priority - b.priority);

    // Get device tokens for emergency contacts
    const phoneNumbers = sortedContacts.map(c => c.phoneNumber);
    const devices = await getDevicesByPhones(phoneNumbers);

    if (devices.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No companion devices registered for emergency contacts',
        totalContacts: sortedContacts.length,
      });
    }

    // Create notification payload
    const fcmPayload = {
      userName: payload.userName,
      crisisLevel: payload.crisisLevel,
      timestamp: new Date().toISOString(),
      userId: payload.userId,
    };

    // Send notifications to all registered devices
    const notificationPromises = devices.map(async (device) => {
      try {
        const success = await sendCriticalAlert(device.deviceToken, fcmPayload, device.platform);

        if (!success) {
          // Remove invalid token
          await removeInvalidDevice(device.deviceToken);
        }

        // Log notification attempt
        const notification = await saveCrisisNotification(
          payload.userId,
          payload.userName,
          device.phoneNumber,
          payload.crisisLevel,
          `Crisis alert sent to ${device.personName}`,
          success ? 'sent' : 'failed'
        );

        return {
          success,
          deviceToken: device.deviceToken,
          recipientPhone: device.phoneNumber,
          recipientName: device.personName,
          notificationId: success ? notification.id : undefined,
          error: success ? undefined : 'Failed to send notification',
        };
      } catch (err: any) {
        console.error(`Error sending to ${device.phoneNumber}:`, err);
        return {
          success: false,
          deviceToken: device.deviceToken,
          recipientPhone: device.phoneNumber,
          error: err.message,
        };
      }
    });

    const results = await Promise.all(notificationPromises);
    const successful = results.filter(r => r.success);

    return res.json({
      success: successful.length > 0,
      totalContacts: sortedContacts.length,
      devicesFound: devices.length,
      notificationsSent: successful.length,
      deliveryStatuses: results,
    });

  } catch (error: any) {
    console.error('Crisis alert error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while sending crisis alerts',
    });
  }
}

export async function registerDevice(req: Request, res: Response) {
  try {
    // Validate request body
    const { error, value } = deviceRegistrationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const registration: DeviceRegistration = value;

    // Register or update device
    const device = await registerDeviceService(registration);

    return res.json({
      success: true,
      message: 'Device registered successfully',
      device: {
        phoneNumber: device.phoneNumber,
        platform: device.platform,
        personName: device.personName,
      },
    });

  } catch (error: any) {
    console.error('Device registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to register device',
    });
  }
}

export async function acknowledgeNotification(req: Request, res: Response) {
  try {
    // Validate request body
    const { error, value } = notificationAckSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const ack: NotificationAck = value;

    // Update notification status
    await updateNotificationStatus(ack.notificationId, 'opened');

    // Update device last active
    // Note: You may want to extract phone number from device token lookup
    // For simplicity, we're just acknowledging the notification

    return res.json({
      success: true,
      message: 'Notification acknowledged',
    });

  } catch (error: any) {
    console.error('Notification acknowledgment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to acknowledge notification',
    });
  }
}

export async function sendTestAlert(req: Request, res: Response) {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required'
      });
    }

    // Get device by phone number
    const devices = await getDevicesByPhones([phoneNumber]);

    if (devices.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No device registered for this phone number',
      });
    }

    const device = devices[0];
    const success = await sendTestNotification(device.deviceToken, device.personName);

    if (success) {
      await updateDeviceLastActive(phoneNumber);
    }

    return res.json({
      success,
      message: success ? 'Test notification sent' : 'Failed to send test notification',
    });

  } catch (error: any) {
    console.error('Test notification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send test notification',
    });
  }
}

export async function getNotificationHistory(req: Request, res: Response) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    const notifications = await getNotificationsByUserService(userId);

    return res.json({
      success: true,
      notifications,
    });

  } catch (error: any) {
    console.error('Get notification history error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch notification history',
    });
  }
}

export async function healthCheck(req: Request, res: Response) {
  return res.json({
    status: 'ok',
    service: 'notification-service',
    timestamp: new Date().toISOString(),
  });
}
