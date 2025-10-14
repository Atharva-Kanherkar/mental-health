import { v4 as uuidv4 } from 'uuid';
import { CompanionDevice, DeviceRegistration } from '../types';
import { query } from '../config/database';

export async function registerDevice(registration: DeviceRegistration): Promise<CompanionDevice> {
  const id = uuidv4();
  const now = new Date();

  const queryText = `
    INSERT INTO companion_devices
    (id, phone_number, device_token, platform, person_name, created_at, last_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (phone_number)
    DO UPDATE SET
      device_token = EXCLUDED.device_token,
      platform = EXCLUDED.platform,
      person_name = EXCLUDED.person_name,
      last_active = EXCLUDED.last_active
    RETURNING *
  `;

  const values = [
    id,
    registration.phoneNumber,
    registration.deviceToken,
    registration.platform,
    registration.personName,
    now,
    now,
  ];

  try {
    const result = await query<CompanionDevice>(queryText, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error registering device:', error);
    throw new Error('Failed to register device');
  }
}

export async function getDeviceByPhone(phoneNumber: string): Promise<CompanionDevice | null> {
  const queryText = 'SELECT * FROM companion_devices WHERE phone_number = $1';

  try {
    const result = await query<CompanionDevice>(queryText, [phoneNumber]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching device:', error);
    return null;
  }
}

export async function getDevicesByPhones(phoneNumbers: string[]): Promise<CompanionDevice[]> {
  if (phoneNumbers.length === 0) return [];

  const queryText = 'SELECT * FROM companion_devices WHERE phone_number = ANY($1)';

  try {
    const result = await query<CompanionDevice>(queryText, [phoneNumbers]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching devices:', error);
    return [];
  }
}

export async function updateDeviceLastActive(phoneNumber: string): Promise<void> {
  const queryText = 'UPDATE companion_devices SET last_active = NOW() WHERE phone_number = $1';

  try {
    await query(queryText, [phoneNumber]);
  } catch (error) {
    console.error('Error updating last active:', error);
  }
}

export async function removeInvalidDevice(deviceToken: string): Promise<void> {
  const queryText = 'DELETE FROM companion_devices WHERE device_token = $1';

  try {
    await query(queryText, [deviceToken]);
    console.log('Removed invalid device token:', deviceToken);
  } catch (error) {
    console.error('Error removing device:', error);
  }
}

export async function linkDeviceToUser(phoneNumber: string, userId: string): Promise<void> {
  const queryText = 'UPDATE companion_devices SET linked_user_id = $1 WHERE phone_number = $2';

  try {
    await query(queryText, [userId, phoneNumber]);
  } catch (error) {
    console.error('Error linking device to user:', error);
  }
}
