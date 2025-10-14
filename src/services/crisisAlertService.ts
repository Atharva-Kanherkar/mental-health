import axios from 'axios';
import prisma from '../prisma/client';

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3001';

interface EmergencyContact {
  phoneNumber: string;
  name: string;
  priority: number;
}

interface CrisisAlertPayload {
  userId: string;
  userName: string;
  crisisLevel: 'moderate' | 'high' | 'critical';
  emergencyContacts: EmergencyContact[];
}

export class CrisisAlertService {

  /**
   * Determines crisis level based on check-in data
   */
  determineCrisisLevel(checkInData: any): 'moderate' | 'high' | 'critical' | null {
    const { hadSuicidalThoughts, actedOnHarm, hadSelfHarmThoughts, overallMood } = checkInData;

    // Critical: Acted on harm
    if (actedOnHarm) {
      return 'critical';
    }

    // High: Suicidal thoughts
    if (hadSuicidalThoughts) {
      return 'high';
    }

    // High: Self-harm thoughts + very low mood
    if (hadSelfHarmThoughts && overallMood <= 3) {
      return 'high';
    }

    // Moderate: Self-harm thoughts alone
    if (hadSelfHarmThoughts && overallMood <= 5) {
      return 'moderate';
    }

    // No crisis detected
    return null;
  }

  /**
   * Gets emergency contacts for a user from their Memory Vault
   */
  async getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
    try {
      const vault = await prisma.memoryVault.findUnique({
        where: { userId },
        include: {
          favPeople: {
            where: {
              phoneNumber: {
                not: null
              },
              priority: {
                lte: 3 // Only high-priority contacts (1-3)
              }
            },
            orderBy: {
              priority: 'asc' // 1 = highest priority
            }
          }
        }
      });

      if (!vault || !vault.favPeople.length) {
        console.warn(`No emergency contacts found for user ${userId}`);
        return [];
      }

      return vault.favPeople.map((person: any) => ({
        phoneNumber: person.phoneNumber!,
        name: person.name,
        priority: person.priority
      }));

    } catch (error) {
      console.error('Error fetching emergency contacts:', error);
      return [];
    }
  }

  /**
   * Sends crisis alert to notification service
   */
  async sendCrisisAlert(
    userId: string,
    userName: string,
    crisisLevel: 'moderate' | 'high' | 'critical'
  ): Promise<boolean> {
    try {
      // Get emergency contacts
      const emergencyContacts = await this.getEmergencyContacts(userId);

      if (emergencyContacts.length === 0) {
        console.warn(`Cannot send crisis alert: No emergency contacts for user ${userId}`);
        return false;
      }

      // Prepare payload
      const payload: CrisisAlertPayload = {
        userId,
        userName,
        crisisLevel,
        emergencyContacts
      };

      console.log(`Sending ${crisisLevel} crisis alert for user ${userId} to ${emergencyContacts.length} contacts`);

      // Call notification microservice
      const response = await axios.post(
        `${NOTIFICATION_SERVICE_URL}/api/notifications/send-crisis-alert`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      if (response.data.success) {
        console.log(`Crisis alert sent successfully: ${response.data.notificationsSent}/${response.data.totalContacts} delivered`);
        return true;
      } else {
        console.error('Crisis alert failed:', response.data);
        return false;
      }

    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error sending crisis alert:', {
          message: error.message,
          code: error.code,
          response: error.response?.data
        });
      } else {
        console.error('Error sending crisis alert:', error);
      }
      return false;
    }
  }

  /**
   * Triggers crisis alert based on check-in data (async, non-blocking)
   */
  async triggerCrisisAlertIfNeeded(userId: string, userName: string, checkInData: any): Promise<void> {
    // Determine crisis level
    const crisisLevel = this.determineCrisisLevel(checkInData);

    if (!crisisLevel) {
      return; // No crisis detected
    }

    console.log(`Crisis detected for user ${userId}: ${crisisLevel} level`);

    // Send alert asynchronously (don't await, don't block response)
    this.sendCrisisAlert(userId, userName, crisisLevel)
      .then(success => {
        if (success) {
          console.log(`Crisis alert successfully triggered for user ${userId}`);
        } else {
          console.error(`Failed to send crisis alert for user ${userId}`);
        }
      })
      .catch(error => {
        console.error(`Error in crisis alert background task for user ${userId}:`, error);
      });
  }

  /**
   * Manually trigger crisis alert (for testing or emergency use)
   */
  async manualTrigger(
    userId: string,
    userName: string,
    crisisLevel: 'moderate' | 'high' | 'critical'
  ): Promise<{ success: boolean; contactsNotified: number }> {
    const success = await this.sendCrisisAlert(userId, userName, crisisLevel);

    if (!success) {
      return { success: false, contactsNotified: 0 };
    }

    const contacts = await this.getEmergencyContacts(userId);
    return { success: true, contactsNotified: contacts.length };
  }
}

export const crisisAlertService = new CrisisAlertService();
