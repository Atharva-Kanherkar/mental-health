# Emergency Crisis Notification System

Complete implementation of a mental health crisis alert system that sends critical notifications to emergency contacts when users show signs of distress.

## Architecture Overview

```
┌─────────────────────┐
│   Main Backend      │
│ (Express + Prisma)  │
│                     │
│ Crisis Detection:   │
│ - Suicidal thoughts │
│ - Self-harm actions │
│ - Low mood + ideation│
└──────────┬──────────┘
           │ HTTP POST
           ↓
┌─────────────────────┐
│ Notification Service│
│ (Express + Firebase)│
│                     │
│ Features:           │
│ - Device management │
│ - FCM integration   │
│ - Delivery tracking │
└──────────┬──────────┘
           │ Firebase Cloud Messaging
           ↓
┌─────────────────────┐
│  Companion App      │
│ (React Native)      │
│                     │
│ Features:           │
│ - Critical alerts   │
│ - Bypass DND        │
│ - Quick actions     │
└──────────┬──────────┘
           │ Alert Display
           ↓
┌─────────────────────┐
│ Emergency Contact   │
│  (Phone/Device)     │
└─────────────────────┘
```

## Components

### 1. Main Backend (/home/atharva/mental-health/)

**Location:** `/home/atharva/mental-health/src/`

**Key Files:**
- `src/services/crisisAlertService.ts` - Crisis detection and alert triggering
- `src/controllers/dailyCheckInController.ts` - Integrated crisis detection
- `src/routes/crisis.ts` - Crisis management endpoints

**Crisis Detection Logic:**
```typescript
Critical Level:
  - actedOnHarm === true

High Level:
  - hadSuicidalThoughts === true
  - hadSelfHarmThoughts + overallMood <= 3

Moderate Level:
  - hadSelfHarmThoughts + overallMood <= 5
```

**Environment Variables:**
Add to `.env`:
```env
NOTIFICATION_SERVICE_URL=https://your-notification-service.ondigitalocean.app
```

**New API Endpoints:**

1. **POST /api/crisis/trigger-alert** (Manual trigger)
   ```bash
   curl -X POST https://api.my-echoes.app/api/crisis/trigger-alert \
     -H "Cookie: auth-session=..." \
     -H "Content-Type: application/json" \
     -d '{"crisisLevel": "high"}'
   ```

2. **GET /api/crisis/emergency-contacts**
   ```bash
   curl https://api.my-echoes.app/api/crisis/emergency-contacts \
     -H "Cookie: auth-session=..."
   ```

3. **GET /api/crisis/test-notification-service**
   ```bash
   curl https://api.my-echoes.app/api/crisis/test-notification-service \
     -H "Cookie: auth-session=..."
   ```

**How It Works:**
1. User submits daily check-in via `/api/checkin` endpoint
2. Controller evaluates crisis indicators
3. If high-risk detected:
   - Gets emergency contacts from Memory Vault (priority 1-3)
   - Calls notification service asynchronously (non-blocking)
   - Returns normal response to user
4. Emergency contacts receive critical alerts on companion app

---

### 2. Notification Microservice (/home/atharva/mental-health/notification-service/)

**Location:** `/home/atharva/mental-health/notification-service/`

**Tech Stack:**
- Node.js + Express + TypeScript
- Firebase Admin SDK (FCM)
- PostgreSQL (shared database)

**Key Files:**
- `src/server.ts` - Express server
- `src/services/fcmService.ts` - Firebase Cloud Messaging
- `src/services/deviceService.ts` - Device token management
- `src/services/notificationLogger.ts` - Notification tracking
- `src/controllers/notificationController.ts` - API endpoints

**Database Schema:**
```sql
-- Companion device tokens
CREATE TABLE companion_devices (
  id UUID PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE,
  device_token VARCHAR(512),
  platform VARCHAR(10),  -- 'ios' or 'android'
  person_name VARCHAR(255),
  linked_user_id UUID,
  created_at TIMESTAMP,
  last_active TIMESTAMP
);

-- Notification history
CREATE TABLE crisis_notifications (
  id UUID PRIMARY KEY,
  user_id UUID,
  user_name VARCHAR(255),
  recipient_phone VARCHAR(20),
  crisis_level VARCHAR(20),
  message TEXT,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  status VARCHAR(20)
);
```

**API Endpoints:**

1. **POST /api/notifications/send-crisis-alert** (Called by main backend)
2. **POST /api/notifications/register-device** (Called by companion app)
3. **POST /api/notifications/ack** (Acknowledgment when alert opened)
4. **POST /api/notifications/test-alert** (Testing)
5. **GET /api/notifications/health** (Health check)

**Environment Setup:**
```env
PORT=3001
DATABASE_URL=postgresql://...  # Same as main backend
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
MAIN_BACKEND_URL=https://api.my-echoes.app
```

**Firebase Setup:**
1. Create Firebase project: https://console.firebase.google.com/
2. Enable Cloud Messaging
3. Go to Project Settings → Service Accounts
4. Generate new private key (JSON)
5. Extract credentials to environment variables

---

### 3. Companion Mobile App (/home/atharva/mental-health/companion-app/)

**Location:** `/home/atharva/mental-health/companion-app/`

**Tech Stack:**
- React Native + Expo
- Firebase Cloud Messaging
- AsyncStorage (local persistence)

**Screens:**
1. **LinkScreen** - Enter phone number and name
2. **ActiveScreen** - Show active protection status
3. **AlertScreen** - Full-screen crisis alert with quick actions

**Key Features:**
- **Critical Alerts**: Bypass Do Not Disturb mode
- **Quick Actions**: Call, text, or acknowledge
- **No Authentication**: Just phone number linking
- **Low Battery**: <1% battery usage per day
- **Always Active**: Persistent background notifications

**Configuration:**
Update `app.json`:
```json
{
  "expo": {
    "extra": {
      "notificationServiceUrl": "https://your-notification-service.ondigitalocean.app"
    }
  }
}
```

**iOS Critical Alerts:**
Requires Apple approval:
1. Go to https://developer.apple.com/contact/request/notifications-critical-alerts-entitlement/
2. Explain mental health crisis use case
3. Wait 1-3 business days for approval
4. Enable in Xcode capabilities

**Android Critical Alerts:**
Automatic with proper permissions:
- `USE_FULL_SCREEN_INTENT`
- `WAKE_LOCK`
- Notification channel with `bypassDnd: true`

---

## Deployment Guide

### Step 1: Deploy Notification Service

**DigitalOcean App Platform:**

1. Create new app from GitHub:
   ```bash
   Service Name: mental-health-notifications
   Type: Web Service
   Source: /notification-service
   Build Command: npm run build
   Run Command: npm start
   ```

2. Set environment variables in dashboard:
   ```
   PORT=3001
   DATABASE_URL=[copy from main backend]
   FIREBASE_PROJECT_ID=[from Firebase Console]
   FIREBASE_CLIENT_EMAIL=[from service account JSON]
   FIREBASE_PRIVATE_KEY=[from service account JSON]
   MAIN_BACKEND_URL=https://api.my-echoes.app
   ```

3. Deploy and note URL (e.g., `https://mental-health-notifications-xxxxx.ondigitalocean.app`)

**Database Setup:**
```bash
# Run migration on main database
psql $DATABASE_URL < /home/atharva/mental-health/notification-service/database/schema.sql
```

### Step 2: Update Main Backend

1. Add environment variable:
   ```bash
   # Add to .env
   NOTIFICATION_SERVICE_URL=https://mental-health-notifications-xxxxx.ondigitalocean.app
   ```

2. Redeploy main backend (DigitalOcean will auto-deploy from Git)

3. Test connection:
   ```bash
   curl https://api.my-echoes.app/api/crisis/test-notification-service \
     -H "Cookie: auth-session=..."
   ```

### Step 3: Build & Distribute Companion App

**Option A: TestFlight (iOS Beta)**
```bash
cd /home/atharva/mental-health/companion-app
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios --profile production
eas submit --platform ios
```

**Option B: Google Play Internal Testing (Android)**
```bash
eas build --platform android --profile production
# Upload APK to Google Play Console → Internal testing
```

**Option C: Direct APK Distribution (Fastest)**
```bash
eas build --platform android --profile preview
# Download APK and share directly
```

---

## Testing Guide

### Test Notification Service Health

```bash
curl https://mental-health-notifications-xxxxx.ondigitalocean.app/api/notifications/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "notification-service",
  "timestamp": "2025-10-14T..."
}
```

### Test Crisis Detection

1. **Login to main app**
2. **Complete daily check-in with high-risk indicators:**
   ```json
   POST /api/checkin
   {
     "overallMood": 2,
     "energyLevel": 3,
     "stressLevel": 9,
     "anxietyLevel": 9,
     "hadSelfHarmThoughts": true,
     "hadSuicidalThoughts": false,
     "actedOnHarm": false
   }
   ```

3. **Check notification service logs:**
   - Should see "Crisis detected" log
   - Should see "Sending high crisis alert" log

4. **Verify companion app receives alert**

### Test Manual Crisis Alert

```bash
curl -X POST https://api.my-echoes.app/api/crisis/trigger-alert \
  -H "Cookie: auth-session=..." \
  -H "Content-Type: application/json" \
  -d '{"crisisLevel": "high"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Crisis alert sent successfully",
  "contactsNotified": 2
}
```

### Test Companion App

1. **Install app on physical device** (emulators don't support push properly)
2. **Link device:**
   - Enter phone number matching FavPerson in Memory Vault
   - Enter name (e.g., "Mom")
   - Grant notification permissions
3. **Send test alert:**
   - Tap "Send Test Alert" button
   - Should receive notification within 5 seconds
4. **Test critical alert:**
   - Enable Do Not Disturb on device
   - Trigger crisis alert from main app
   - Alert should bypass DND and show full screen

---

## Emergency Contact Setup

For crisis alerts to work, users must:

1. **Add emergency contacts to Memory Vault:**
   ```
   Go to: Memory Vault → Favorite People → Add Person

   Required fields:
   - Name: "Mom", "Dad", "Sarah", etc.
   - Phone Number: +1234567890 (with country code)
   - Priority: 1-3 (1 = highest, only 1-3 get crisis alerts)
   ```

2. **Emergency contacts install companion app:**
   ```
   Download companion app
   Enter phone number (must match FavPerson phone)
   Grant notification permissions
   ```

3. **Verify link:**
   ```bash
   curl https://api.my-echoes.app/api/crisis/emergency-contacts \
     -H "Cookie: auth-session=..."
   ```

---

## Monitoring & Analytics

### Notification Delivery Metrics

**View notification history:**
```bash
curl https://mental-health-notifications-xxxxx.ondigitalocean.app/api/notifications/history/{userId}
```

**Database Queries:**
```sql
-- Recent crisis alerts
SELECT
  user_name,
  recipient_phone,
  crisis_level,
  status,
  sent_at,
  opened_at
FROM crisis_notifications
WHERE sent_at >= NOW() - INTERVAL '24 hours'
ORDER BY sent_at DESC;

-- Delivery success rate
SELECT
  crisis_level,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'opened' THEN 1 ELSE 0 END) as opened,
  ROUND(100.0 * SUM(CASE WHEN status = 'opened' THEN 1 ELSE 0 END) / COUNT(*), 2) as open_rate
FROM crisis_notifications
GROUP BY crisis_level;

-- Active companion devices
SELECT
  COUNT(*) as total_devices,
  COUNT(CASE WHEN last_active >= NOW() - INTERVAL '7 days' THEN 1 END) as active_last_7_days,
  COUNT(CASE WHEN linked_user_id IS NOT NULL THEN 1 END) as linked_devices
FROM companion_devices;
```

### Logging

**Main Backend:**
```bash
# Check crisis detection logs
grep "Crisis detected" /var/log/mental-health-backend.log

# Check notification service calls
grep "Sending crisis alert" /var/log/mental-health-backend.log
```

**Notification Service:**
```bash
# Check FCM delivery
grep "FCM notification sent" /var/log/notification-service.log

# Check failures
grep "FCM send error" /var/log/notification-service.log
```

---

## Security & Privacy

### Data Protection

1. **Phone Numbers**: Stored securely, masked in API responses
2. **Device Tokens**: Encrypted in transit, removed when invalid
3. **Crisis Data**: Not stored in companion app, only in main backend
4. **No PII Exposure**: Companion app only shows first name

### Access Control

1. **Notification Service**: Internal service, no public endpoints
2. **Crisis Routes**: Require authentication via Better Auth
3. **Companion App**: No authentication, device-level security

### Compliance

- **HIPAA**: Not HIPAA compliant (would require additional safeguards)
- **GDPR**: User consent required, data deletion on request
- **State Laws**: Varies by jurisdiction, consult legal counsel

---

## Troubleshooting

### Alerts Not Sending

1. **Check notification service is running:**
   ```bash
   curl https://mental-health-notifications-xxxxx.ondigitalocean.app/api/notifications/health
   ```

2. **Verify emergency contacts exist:**
   ```bash
   curl https://api.my-echoes.app/api/crisis/emergency-contacts \
     -H "Cookie: auth-session=..."
   ```

3. **Check main backend logs:**
   ```bash
   grep "Crisis detected" logs
   ```

4. **Verify NOTIFICATION_SERVICE_URL environment variable is set**

### Companion App Not Receiving Alerts

1. **Check device registration:**
   ```sql
   SELECT * FROM companion_devices WHERE phone_number = '+1234567890';
   ```

2. **Verify notification permissions granted**

3. **Check Firebase Console for delivery errors**

4. **Test with test alert button in app**

5. **iOS only: Verify Critical Alerts entitlement approved**

### Database Connection Issues

1. **Verify DATABASE_URL is identical in both services**

2. **Check SSL mode:** `?sslmode=require`

3. **Test connection:**
   ```bash
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM companion_devices;"
   ```

---

## Future Enhancements

### Priority 1 (Critical)
- [ ] SMS fallback when push notifications fail
- [ ] Webhook for emergency services integration
- [ ] Geolocation sharing in crisis mode

### Priority 2 (Important)
- [ ] Multi-language support
- [ ] Custom alert messages per contact
- [ ] Alert escalation (if not acknowledged in 5 min, notify next contact)

### Priority 3 (Nice to Have)
- [ ] Voice call option in companion app
- [ ] Crisis resource directory in alert screen
- [ ] Analytics dashboard for crisis trends

---

## Support & Contact

**Documentation:**
- Main Backend: `/home/atharva/mental-health/README.md`
- Notification Service: `/home/atharva/mental-health/notification-service/README.md`
- Companion App: `/home/atharva/mental-health/companion-app/README.md`

**System Status:**
- Main Backend: https://api.my-echoes.app/health
- Notification Service: https://[your-url]/api/notifications/health

**Emergency Contacts:**
- National Suicide Prevention Lifeline: 988
- Crisis Text Line: Text HOME to 741741
- Emergency Services: 911

---

## License

MIT License - See LICENSE file for details.

**Disclaimer:** This system is designed to support mental health awareness and intervention. It is NOT a replacement for professional mental health services or emergency response systems. If you or someone you know is in immediate danger, call 911 or your local emergency services.
