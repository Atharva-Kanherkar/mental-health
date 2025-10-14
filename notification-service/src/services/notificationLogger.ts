import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import { CrisisNotification } from '../types';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

export async function logNotification(
  userId: string,
  recipientPhone: string,
  crisisLevel: 'moderate' | 'high' | 'critical',
  message: string,
  status: 'sent' | 'failed'
): Promise<string> {
  const id = uuidv4();

  const query = `
    INSERT INTO crisis_notifications
    (id, user_id, recipient_phone, crisis_level, message, sent_at, status)
    VALUES ($1, $2, $3, $4, $5, NOW(), $6)
    RETURNING id
  `;

  try {
    const result = await pool.query(query, [id, userId, recipientPhone, crisisLevel, message, status]);
    return result.rows[0].id;
  } catch (error) {
    console.error('Error logging notification:', error);
    throw error;
  }
}

export async function updateNotificationDelivered(notificationId: string): Promise<void> {
  const query = `
    UPDATE crisis_notifications
    SET status = 'delivered', delivered_at = NOW()
    WHERE id = $1
  `;

  try {
    await pool.query(query, [notificationId]);
  } catch (error) {
    console.error('Error updating notification delivered status:', error);
  }
}

export async function updateNotificationOpened(notificationId: string): Promise<void> {
  const query = `
    UPDATE crisis_notifications
    SET status = 'opened', opened_at = NOW()
    WHERE id = $1
  `;

  try {
    await pool.query(query, [notificationId]);
  } catch (error) {
    console.error('Error updating notification opened status:', error);
  }
}

export async function getNotificationsByUser(userId: string): Promise<CrisisNotification[]> {
  const query = `
    SELECT * FROM crisis_notifications
    WHERE user_id = $1
    ORDER BY sent_at DESC
    LIMIT 50
  `;

  try {
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

export async function getRecentNotifications(hours: number = 24): Promise<CrisisNotification[]> {
  const query = `
    SELECT * FROM crisis_notifications
    WHERE sent_at >= NOW() - INTERVAL '${hours} hours'
    ORDER BY sent_at DESC
  `;

  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching recent notifications:', error);
    return [];
  }
}
