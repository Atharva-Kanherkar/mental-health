# Emergency Notification System

Complete crisis alert system for the Mental Health application with microservice architecture and companion mobile app.

## System Overview

```
┌─────────────────────┐
│   Main Mobile App   │
│  (User Check-in)    │
└──────────┬──────────┘
           │
           │ Crisis Detected
           │
           ▼
┌─────────────────────┐
│   Main Backend      │
│ (Crisis Detection)  │
└──────────┬──────────┘
           │
           │ HTTP POST
           │
           ▼
┌─────────────────────┐
│ Notification Service│
│   (Microservice)    │
└──────────┬──────────┘
           │
           │ Firebase Cloud Messaging
           │
           ▼
┌─────────────────────┐
│  Companion Apps     │
│ (Emergency Contacts)│
└─────────────────────┘
           │
           │ Critical Alert
           │
           ▼
┌─────────────────────┐
│ Emergency Contact   │
│   (Call/Text)       │
└─────────────────────┘
```

## Components

### 1. Main Backend Integration

**Location:** `/home/atharva/mental-health/src/`

**Key Files:**
- `services/crisisAlertService.ts` - Crisis detection and alert orchestration
- `controllers/dailyCheckInController.ts` - Triggers alerts on high-risk check-ins

**Crisis Detection Logic:**
```typescript
// Critical: User acted on self-harm
if (actedOnHarm) → 'critical' alert

// High: Suicidal thoughts OR self-harm thoughts + very low mood
if (hadSuicidalThoughts || (hadSelfHarmThoughts && overallMood <= 3)) → 'high' alert

// Moderate: Self-harm thoughts + low mood
if (hadSelfHarmThoughts && overallMood <= 5) → 'moderate' alert
```

**Emergency Contact Selection:**
- Fetches from user's Memory Vault (favPeople)
- Only contacts with priority 1-3 (highest priority)
- Must have valid phone numbers
- Sorted by priority (1 = highest)

**Environment Variables:**
```env
NOTIFICATION_SERVICE_URL=https://notifications-api.my-echoes.app
```

---

### 2. Notification Microservice

**Location:** `/home/atharva/mental-health/notification-service/`

**Tech Stack:**
- Express 4.x + TypeScript
- Firebase Admin SDK (FCM)
- PostgreSQL (shared database)
- Node.js 18+

**Database Tables:**

```sql
-- companion_devices: Stores device tokens for emergency contacts
CREATE TABLE companion_devices (
  id UUID PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  device_token VARCHAR(512) NOT NULL,
  platform VARCHAR(10) NOT NULL CHECK (platform IN ('ios', 'android')),
  person_name VARCHAR(255) NOT NULL,
  linked_user_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW()
);

-- crisis_notifications: Logs all crisis alerts sent
CREATE TABLE crisis_notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  crisis_level VARCHAR(20) NOT NULL,
  message TEXT,
  sent_at TIMESTAMP DEFAULT NOW(),
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'sent'
);
```

**API Endpoints:**

1. **POST /api/notifications/send-crisis-alert**
   - Called by main backend when crisis detected
   - Sends FCM messages to all registered emergency contacts
   - Returns delivery statuses

2. **POST /api/notifications/register-device**
   - Called by companion app on first launch
   - Registers device token for push notifications
   - Upserts on phone number (allows token refresh)

3. **POST /api/notifications/ack**
   - Called when emergency contact acknowledges alert
   - Updates notification status to 'opened'

4. **POST /api/notifications/test-alert**
   - Send test notification to verify setup
   - For development and testing

5. **GET /api/notifications/history/:userId**
   - Get crisis notification history for a user

6. **GET /api/notifications/health**
   - Health check endpoint

**Setup:**

```bash
cd notification-service
npm install
cp .env.example .env
# Configure Firebase and Database
npm run dev        # Development
npm run build      # Production build
npm start          # Production
```

**Environment Variables:**
```env
PORT=3001
DATABASE_URL=postgresql://...
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
FIREBASE_PRIVATE_KEY=base64_encoded_key
CORS_ORIGIN=https://api.my-echoes.app
```

**Firebase Setup:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create project or use existing
3. Project Settings → Service Accounts
4. Generate New Private Key
5. Base64 encode private key: `cat service-account.json | base64`
6. Add to .env file

**Deployment (DigitalOcean App Platform):**

1. Create new app from GitHub repo
2. Set build command: `npm run build`
3. Set run command: `npm start`
4. Add environment variables
5. Set HTTP port: 3001
6. Deploy

---

### 3. Companion Mobile App

**Location:** `/home/atharva/mental-health/companion-app/`

**Tech Stack:**
- React Native + Expo
- TypeScript
- Expo Notifications (FCM)
- React Navigation

**App Flow:**

```
Launch App
    │
    ├─ Is Linked? NO → LinkScreen
    │                   │
    │                   └─ Enter phone + name
    │                      Request permissions
    │                      Get device token
    │                      Register with backend
    │                      Navigate to ActiveScreen
    │
    └─ Is Linked? YES → ActiveScreen
                         │
                         ├─ Show "Active Protection" status
                         ├─ Display user info
                         ├─ Test Alert button
                         │
                         └─ Crisis Alert Received → AlertScreen
                                                    │
                                                    ├─ Full screen modal
                                                    ├─ Red/Orange gradient
                                                    ├─ Auto-vibrate
                                                    ├─ Show user name
                                                    └─ Actions:
                                                       - Call User
                                                       - Text User
                                                       - I've Contacted Them
                                                       - Call 911
```

**Screens:**

1. **LinkScreen** (`src/screens/LinkScreen.tsx`)
   - Phone number input (auto-formats with +1)
   - Name input (e.g., "Mom", "Dad")
   - Requests critical alert permissions
   - Registers device with notification service

2. **ActiveScreen** (`src/screens/ActiveScreen.tsx`)
   - Green checkmark shield icon
   - Shows: "Active Protection"
   - Displays user info and status
   - Test Alert button
   - Unlink Device button
   - Last checked timestamp

3. **AlertScreen** (`src/screens/AlertScreen.tsx`)
   - Full screen modal with gradient background
   - Crisis level badge (Critical/High/Moderate)
   - Large warning icon
   - User name and timestamp
   - Action buttons:
     - Call [User] - Opens phone dialer
     - Text [User] - Opens SMS app
     - I've Contacted Them - Acknowledges and dismisses
   - Emergency Services button (Call 911)
   - Auto-vibrates on display

**Notification Setup:**

iOS:
```json
{
  "infoPlist": {
    "UIBackgroundModes": ["remote-notification"],
    "UNUserNotificationCenter": {
      "UNAuthorizationOptionCriticalAlert": true
    }
  }
}
```

Android:
```json
{
  "permissions": [
    "POST_NOTIFICATIONS",
    "VIBRATE",
    "USE_FULL_SCREEN_INTENT",
    "WAKE_LOCK"
  ],
  "useNextNotificationsApi": true
}
```

**Setup:**

```bash
cd companion-app
npm install
npx expo start

# Build for production
npx expo build:android
npx expo build:ios
```

**Configuration:**

Update `app.json`:
```json
{
  "extra": {
    "notificationServiceUrl": "https://notifications-api.my-echoes.app"
  }
}
```

**Key Features:**
- Critical alerts bypass Do Not Disturb
- Works in background/foreground/killed state
- Auto-vibrates in emergency pattern
- One-tap call/text emergency contact
- Direct link to emergency services (911)
- Minimal, clean UI focused on action

---

## Deployment Guide

### Prerequisites

1. Firebase project with Cloud Messaging enabled
2. PostgreSQL database (shared with main backend)
3. DigitalOcean account (or similar hosting)
4. iOS/Android developer accounts (for app store)

### Step 1: Deploy Notification Service

```bash
# 1. Create DigitalOcean App
doctl apps create --spec notification-service-spec.yaml

# 2. Configure environment variables in dashboard
# 3. Deploy
doctl apps deploy <app-id>

# 4. Get service URL
doctl apps get <app-id>
# Note: https://your-notification-service.ondigitalocean.app
```

### Step 2: Update Main Backend

```bash
# Add environment variable to main backend
NOTIFICATION_SERVICE_URL=https://notifications-api.my-echoes.app

# Redeploy main backend
```

### Step 3: Run Database Migration

```bash
# Connect to database
psql $DATABASE_URL

# Run migration
\i notification-service/database/schema.sql

# Verify tables created
\dt companion_devices
\dt crisis_notifications
```

### Step 4: Deploy Companion App

```bash
cd companion-app

# Update app.json with notification service URL
# Build and submit to app stores

# Android
eas build --platform android
eas submit --platform android

# iOS
eas build --platform ios
eas submit --platform ios
```

### Step 5: Test End-to-End

```bash
# 1. Install companion app on test device
# 2. Link device with phone number
# 3. In main app, add that phone to Memory Vault (priority 1-3)
# 4. Submit high-risk daily check-in
# 5. Verify companion app receives critical alert
```

---

## Testing

### Test Notification Delivery

```bash
# Send test alert via API
curl -X POST https://notifications-api.my-echoes.app/api/notifications/test-alert \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+15551234567"}'
```

### Test Crisis Detection

```typescript
// In main app, submit check-in with:
{
  "overallMood": 2,
  "stressLevel": 9,
  "anxietyLevel": 9,
  "hadSelfHarmThoughts": true,
  "hadSuicidalThoughts": false
}
// Should trigger 'high' level alert
```

### Verify FCM Configuration

```bash
# Check Firebase Console → Cloud Messaging
# Verify notifications are being sent
# Check delivery success rate
```

---

## Monitoring

### Key Metrics

1. **Notification Delivery Rate**
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE status = 'sent') as sent,
     COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
     COUNT(*) FILTER (WHERE status = 'opened') as opened,
     COUNT(*) FILTER (WHERE status = 'failed') as failed
   FROM crisis_notifications
   WHERE sent_at > NOW() - INTERVAL '7 days';
   ```

2. **Active Companion Devices**
   ```sql
   SELECT COUNT(*)
   FROM companion_devices
   WHERE last_active > NOW() - INTERVAL '30 days';
   ```

3. **Response Time**
   ```sql
   SELECT
     AVG(EXTRACT(EPOCH FROM (opened_at - sent_at))) as avg_response_seconds
   FROM crisis_notifications
   WHERE opened_at IS NOT NULL;
   ```

### Alerts to Set Up

- Notification service downtime
- Firebase delivery failures > 10%
- Database connection pool exhaustion
- No active companion devices for high-risk users

---

## Security Considerations

1. **API Authentication**
   - Add API key authentication between main backend and notification service
   - Implement rate limiting

2. **Data Privacy**
   - Encrypt phone numbers at rest
   - Anonymize notification logs after 30 days
   - HIPAA compliance considerations

3. **Device Token Security**
   - Tokens automatically expire when app uninstalled
   - Service auto-removes invalid tokens
   - Users can unlink devices at any time

4. **Emergency Contact Verification**
   - Consider SMS verification for companion app registration
   - Allow users to remove/block companion devices

---

## Cost Estimation

### Firebase (Free Tier)
- 10M messages/month: **$0**
- Beyond 10M: $0.05 per 1K messages

### DigitalOcean Notification Service
- Basic App: **$5/mo** (covered by credits)
- Can auto-scale to Professional: $12/mo

### Database
- Shared with main backend: **$0 additional**

### Total Additional Cost: **$0-5/mo**

---

## Troubleshooting

### Notifications not receiving

1. Check companion app permissions (Settings → Notifications)
2. Verify device token registered: Check `companion_devices` table
3. Check Firebase Console for delivery errors
4. Verify phone number format (must include country code)

### Firebase connection errors

```bash
# Verify credentials
echo $FIREBASE_PRIVATE_KEY | base64 -d | jq .

# Test Firebase connection
curl -X POST https://notifications-api.my-echoes.app/api/notifications/health
```

### Database connection issues

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM companion_devices;"

# Check connection pool
# Look for: "Database connection pool initialized"
```

---

## Support Resources

- **Firebase Docs**: https://firebase.google.com/docs/cloud-messaging
- **Expo Notifications**: https://docs.expo.dev/versions/latest/sdk/notifications/
- **DigitalOcean Apps**: https://docs.digitalocean.com/products/app-platform/

---

## Future Enhancements

1. **Multi-language Support**
   - Localize companion app
   - Support international phone formats

2. **Escalation Protocols**
   - Auto-escalate if no response within X minutes
   - Send to next priority contacts

3. **Location Sharing**
   - Optional location sharing in critical alerts
   - Requires additional permissions

4. **Web Dashboard**
   - View notification history
   - Manage companion devices
   - Analytics and insights

5. **AI-Enhanced Detection**
   - Natural language analysis of journal entries
   - Behavioral pattern recognition
   - Predictive crisis intervention

---

## License

MIT License - See main project LICENSE file
