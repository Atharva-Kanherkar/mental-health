import { v4 as uuidv4 } from 'uuid';
import { CrisisNotification } from '../types';
import { query } from '../config/database';

export async function saveCrisisNotification(
  userId: string,
  userName: string,
  recipientPhone: string,
  crisisLevel: 'moderate' | 'high' | 'critical',
  message: string,
  status: 'sent' | 'delivered' | 'opened' | 'failed' = 'sent'
): Promise<CrisisNotification> {
  const id = uuidv4();
  const now = new Date();

  const queryText = `
    INSERT INTO crisis_notifications
    (id, user_id, user_name, recipient_phone, crisis_level, message, sent_at, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;

  const values = [id, userId, userName, recipientPhone, crisisLevel, message, now, status];

  try {
    const result = await query<CrisisNotification>(queryText, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error saving crisis notification:', error);
    throw new Error('Failed to save crisis notification');
  }
}

export async function updateNotificationStatus(
  notificationId: string,
  status: 'delivered' | 'opened' | 'failed'
): Promise<void> {
  const timestampField = status === 'delivered' ? 'delivered_at' : status === 'opened' ? 'opened_at' : null;

  let queryText = 'UPDATE crisis_notifications SET status = $1';
  const values: any[] = [status];

  if (timestampField) {
    queryText += `, ${timestampField} = $2 WHERE id = $3`;
    values.push(new Date(), notificationId);
  } else {
    queryText += ' WHERE id = $2';
    values.push(notificationId);
  }

  try {
    await query(queryText, values);
  } catch (error) {
    console.error('Error updating notification status:', error);
  }
}

export async function getNotificationsByUser(userId: string, limit: number = 50): Promise<CrisisNotification[]> {
  const queryText = `
    SELECT * FROM crisis_notifications
    WHERE user_id = $1
    ORDER BY sent_at DESC
    LIMIT $2
  `;

  try {
    const result = await query<CrisisNotification>(queryText, [userId, limit]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

export async function acknowledgeNotification(
  userId: string,
  recipientPhone: string
): Promise<void> {
  const queryText = `
    UPDATE crisis_notifications
    SET status = 'opened', opened_at = NOW()
    WHERE user_id = $1
      AND recipient_phone = $2
      AND status != 'opened'
      AND sent_at > NOW() - INTERVAL '1 hour'
    RETURNING id
  `;

  try {
    const result = await query(queryText, [userId, recipientPhone]);
    if (result.rows.length > 0) {
      console.log(`Acknowledged ${result.rows.length} notifications for user ${userId}`);
    }
  } catch (error) {
    console.error('Error acknowledging notification:', error);
  }
}
