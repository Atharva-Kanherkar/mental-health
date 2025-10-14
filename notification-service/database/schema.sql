-- Companion Devices Table
-- Stores device tokens and information for emergency contacts' companion apps
CREATE TABLE IF NOT EXISTS companion_devices (
  id UUID PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  device_token VARCHAR(512) NOT NULL,
  platform VARCHAR(10) NOT NULL CHECK (platform IN ('ios', 'android')),
  person_name VARCHAR(255) NOT NULL,
  linked_user_id UUID, -- References User.id in main database
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_companion_devices_phone ON companion_devices(phone_number);
CREATE INDEX IF NOT EXISTS idx_companion_devices_linked_user ON companion_devices(linked_user_id);
CREATE INDEX IF NOT EXISTS idx_companion_devices_last_active ON companion_devices(last_active);

-- Crisis Notifications Table
-- Logs all crisis notifications sent to emergency contacts
CREATE TABLE IF NOT EXISTS crisis_notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  crisis_level VARCHAR(20) NOT NULL CHECK (crisis_level IN ('moderate', 'high', 'critical')),
  message TEXT,
  sent_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'failed'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_crisis_notifications_user ON crisis_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_crisis_notifications_recipient ON crisis_notifications(recipient_phone);
CREATE INDEX IF NOT EXISTS idx_crisis_notifications_sent_at ON crisis_notifications(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_crisis_notifications_status ON crisis_notifications(status);

-- Comments for documentation
COMMENT ON TABLE companion_devices IS 'Stores device tokens for emergency contacts companion apps';
COMMENT ON TABLE crisis_notifications IS 'Logs all crisis alert notifications sent to emergency contacts';

COMMENT ON COLUMN companion_devices.phone_number IS 'Emergency contact phone number (unique)';
COMMENT ON COLUMN companion_devices.device_token IS 'FCM device token for push notifications';
COMMENT ON COLUMN companion_devices.platform IS 'Mobile platform: ios or android';
COMMENT ON COLUMN companion_devices.linked_user_id IS 'Optional: Reference to main app user being protected';
COMMENT ON COLUMN companion_devices.last_active IS 'Last time device was active or received notification';

COMMENT ON COLUMN crisis_notifications.user_id IS 'User who triggered the crisis alert';
COMMENT ON COLUMN crisis_notifications.recipient_phone IS 'Emergency contact who received the alert';
COMMENT ON COLUMN crisis_notifications.crisis_level IS 'Severity: moderate, high, or critical';
COMMENT ON COLUMN crisis_notifications.status IS 'Delivery status: sent, delivered, opened, or failed';
