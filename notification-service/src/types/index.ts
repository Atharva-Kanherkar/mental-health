export interface CompanionDevice {
  id: string;
  phoneNumber: string;
  deviceToken: string;
  platform: 'ios' | 'android';
  personName: string;
  linkedUserId?: string;
  createdAt: Date;
  lastActive: Date;
}

export interface CrisisNotification {
  id: string;
  userId: string;
  recipientPhone: string;
  crisisLevel: 'moderate' | 'high' | 'critical';
  message: string;
  sentAt: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  status: 'sent' | 'delivered' | 'opened' | 'failed';
}

export interface EmergencyContact {
  phoneNumber: string;
  name: string;
  priority: number;
}

export interface CrisisAlertPayload {
  userId: string;
  userName: string;
  crisisLevel: 'moderate' | 'high' | 'critical';
  emergencyContacts: EmergencyContact[];
}

export interface DeviceRegistration {
  phoneNumber: string;
  deviceToken: string;
  platform: 'ios' | 'android';
  personName: string;
}

export interface NotificationAck {
  notificationId: string;
  deviceToken: string;
}

export interface FCMPayload {
  userName: string;
  crisisLevel: string;
  timestamp: string;
  userId: string;
  userPhone?: string;
}

export interface NotificationDeliveryStatus {
  success: boolean;
  deviceToken: string;
  recipientPhone: string;
  messageId?: string;
  error?: string;
}

export interface CrisisAlertResponse {
  success: boolean;
  totalContacts: number;
  notificationsSent: number;
  deliveryStatuses: NotificationDeliveryStatus[];
  errors?: string[];
}
