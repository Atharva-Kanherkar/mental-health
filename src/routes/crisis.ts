import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { crisisAlertService } from '../services/crisisAlertService';

const router = Router();

/**
 * POST /api/crisis/trigger-alert
 * Manually trigger a crisis alert (for testing or emergency use)
 *
 * Body:
 * - crisisLevel: 'moderate' | 'high' | 'critical'
 */
router.post('/trigger-alert', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userName = req.user?.name || 'User';

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { crisisLevel } = req.body;

    if (!crisisLevel || !['moderate', 'high', 'critical'].includes(crisisLevel)) {
      return res.status(400).json({
        error: 'Invalid crisis level. Must be: moderate, high, or critical'
      });
    }

    const result = await crisisAlertService.manualTrigger(userId, userName, crisisLevel);

    if (result.success) {
      res.json({
        success: true,
        message: 'Crisis alert sent successfully',
        contactsNotified: result.contactsNotified
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send crisis alert',
        contactsNotified: 0
      });
    }

  } catch (error) {
    console.error('Error in manual crisis trigger:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/crisis/emergency-contacts
 * Get list of emergency contacts configured for this user
 */
router.get('/emergency-contacts', requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const contacts = await crisisAlertService.getEmergencyContacts(userId);

    res.json({
      success: true,
      contacts: contacts.map(c => ({
        name: c.name,
        phoneNumber: c.phoneNumber.slice(0, 3) + '***' + c.phoneNumber.slice(-4), // Mask middle digits
        priority: c.priority
      })),
      total: contacts.length
    });

  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/crisis/test-notification-service
 * Test if notification service is reachable
 */
router.get('/test-notification-service', requireAuth, async (req, res) => {
  try {
    const axios = require('axios');
    const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3001';

    const response = await axios.get(`${NOTIFICATION_SERVICE_URL}/api/notifications/health`, {
      timeout: 5000
    });

    res.json({
      success: true,
      notificationServiceStatus: response.data.status,
      url: NOTIFICATION_SERVICE_URL
    });

  } catch (error: any) {
    console.error('Notification service test failed:', error.message);
    res.status(503).json({
      success: false,
      error: 'Notification service unavailable',
      message: error.message
    });
  }
});

export default router;
