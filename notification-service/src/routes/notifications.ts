import { Router } from 'express';
import {
  sendCrisisAlert,
  registerDevice,
  acknowledgeNotification,
  sendTestAlert,
  getNotificationHistory,
  healthCheck,
} from '../controllers/notificationController';

const router = Router();

// Health check
router.get('/health', healthCheck);

// Crisis alert endpoint (called by main backend)
router.post('/send-crisis-alert', sendCrisisAlert);

// Device registration (called by companion app)
router.post('/register-device', registerDevice);

// Notification acknowledgment (called by companion app when alert opened)
router.post('/ack', acknowledgeNotification);

// Test notification (for testing purposes)
router.post('/test-alert', sendTestAlert);

// Get notification history for a user
router.get('/history/:userId', getNotificationHistory);

export default router;
