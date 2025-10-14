# Crisis Notification System - Quick Start

Get the emergency notification system running in under 30 minutes.

## Prerequisites

- ✅ Main backend deployed and running (https://api.my-echoes.app)
- ✅ PostgreSQL database accessible
- ✅ Firebase account (free tier is sufficient)
- ✅ DigitalOcean account with App Platform credits

## Step 1: Firebase Setup (5 minutes)

1. **Create Firebase project:**
   - Go to https://console.firebase.google.com/
   - Click "Add project"
   - Name: "mental-health-notifications"
   - Disable Google Analytics (optional)

2. **Enable Cloud Messaging:**
   - In Firebase Console, click "Build" → "Cloud Messaging"
   - Click "Get Started" if prompted

3. **Generate service account:**
   - Go to Project Settings (gear icon) → "Service accounts"
   - Click "Generate new private key"
   - Download JSON file
   - **Keep this file secure!**

4. **Extract credentials:**
   Open the downloaded JSON file and find:
   ```json
   {
     "project_id": "your-project-id",
     "client_email": "firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   }
   ```
   You'll need these values for environment variables.

## Step 2: Deploy Notification Service (10 minutes)

1. **Push code to GitHub:**
   ```bash
   cd /home/atharva/mental-health
   git add notification-service/
   git commit -m "Add notification microservice"
   git push origin main
   ```

2. **Create DigitalOcean App:**
   - Go to https://cloud.digitalocean.com/apps
   - Click "Create App"
   - Choose "GitHub" as source
   - Select your repository
   - **Specify source directory:** `notification-service`
   - Click "Next"

3. **Configure build settings:**
   ```
   Name: mental-health-notifications
   Environment: Node.js
   Build Command: npm run build
   Run Command: npm start
   HTTP Port: 3001
   Instance Size: Basic ($5/mo)
   ```

4. **Add environment variables:**
   Click "Environment Variables" and add:
   ```
   PORT=3001
   NODE_ENV=production
   DATABASE_URL=[copy from main backend .env]
   FIREBASE_PROJECT_ID=[from Firebase JSON]
   FIREBASE_CLIENT_EMAIL=[from Firebase JSON]
   FIREBASE_PRIVATE_KEY=[from Firebase JSON, keep quotes and newlines]
   MAIN_BACKEND_URL=https://api.my-echoes.app
   ```

   **Important:** For `FIREBASE_PRIVATE_KEY`, paste the entire value including:
   ```
   "-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n"
   ```

5. **Deploy:**
   - Click "Next" → "Create Resources"
   - Wait 5-10 minutes for deployment
   - Note the URL (e.g., `https://mental-health-notifications-xxxxx.ondigitalocean.app`)

6. **Verify deployment:**
   ```bash
   curl https://mental-health-notifications-xxxxx.ondigitalocean.app/api/notifications/health
   ```

   Should return:
   ```json
   {
     "status": "ok",
     "service": "notification-service",
     "timestamp": "..."
   }
   ```

## Step 3: Setup Database (2 minutes)

```bash
# Connect to database and run schema
psql "postgresql://doadmin:...@db-postgresql-nyc3-73184-do-user-15467500-0.i.db.ondigitalocean.com:25060/defaultdb?sslmode=require" \
  -f /home/atharva/mental-health/notification-service/database/schema.sql
```

Or manually:
1. Copy contents of `/home/atharva/mental-health/notification-service/database/schema.sql`
2. Go to DigitalOcean → Databases → Your Database → "Console" tab
3. Paste and execute SQL

Verify tables created:
```sql
\dt
```
Should show:
- `companion_devices`
- `crisis_notifications`

## Step 4: Update Main Backend (3 minutes)

1. **Add environment variable to main backend:**

   In DigitalOcean App Platform (main backend):
   - Go to your main app → Settings → Environment Variables
   - Add:
     ```
     NOTIFICATION_SERVICE_URL=https://mental-health-notifications-xxxxx.ondigitalocean.app
     ```

2. **Redeploy main backend:**
   - DigitalOcean will auto-redeploy if connected to GitHub
   - Or manually trigger deploy in dashboard

3. **Test connection:**
   ```bash
   # Login to main app first, get auth cookie
   curl https://api.my-echoes.app/api/crisis/test-notification-service \
     -H "Cookie: auth-session=your-session-cookie" \
     -H "Content-Type: application/json"
   ```

   Should return:
   ```json
   {
     "success": true,
     "notificationServiceStatus": "ok",
     "url": "https://mental-health-notifications-xxxxx.ondigitalocean.app"
   }
   ```

## Step 5: Build Companion App (10 minutes)

### Option A: Test Locally First (Fastest)

```bash
cd /home/atharva/mental-health/companion-app

# Install dependencies
npm install

# Update notification service URL in app.json
# Edit app.json and set:
# "extra": {
#   "notificationServiceUrl": "https://mental-health-notifications-xxxxx.ondigitalocean.app"
# }

# Start Expo development server
npm start

# Scan QR code with Expo Go app on your phone
```

### Option B: Build Production APK (Android)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login
eas login

# Configure
eas build:configure

# Build for Android
eas build --platform android --profile preview

# Wait 10-15 minutes for build
# Download APK and install on device
```

### Option C: Build for iOS (Requires Apple Developer Account)

```bash
# Build for iOS
eas build --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios
```

## Step 6: Test End-to-End (5 minutes)

### Test 1: Register Companion Device

1. **Open companion app on physical device**
2. **Enter phone number:** `+1234567890` (with country code)
3. **Enter name:** `Mom` (or any name)
4. **Grant notification permissions**
5. **Tap "Link Device"**
6. Should see success message and navigate to Active screen

### Test 2: Verify Device Registration

```bash
# Check database
psql $DATABASE_URL -c "SELECT * FROM companion_devices;"
```

Should show your registered device.

### Test 3: Send Test Alert

In companion app:
1. Tap "Send Test Alert" button
2. Should receive test notification within 5 seconds

### Test 4: Add Emergency Contact in Main App

1. Login to main app (web or mobile)
2. Go to Memory Vault → Favorite People
3. Add person:
   ```
   Name: Mom
   Phone: +1234567890 (same as companion app)
   Priority: 1
   ```
4. Save

### Test 5: Trigger Crisis Alert

**Method A: Via Check-In**
1. In main app, go to Daily Check-In
2. Submit check-in with:
   ```
   Overall Mood: 2
   Stress Level: 9
   Anxiety Level: 9
   Self-harm thoughts: Yes
   ```
3. Submit
4. Companion app should receive critical alert within 10 seconds

**Method B: Manual Trigger (API)**
```bash
curl -X POST https://api.my-echoes.app/api/crisis/trigger-alert \
  -H "Cookie: auth-session=your-session-cookie" \
  -H "Content-Type: application/json" \
  -d '{"crisisLevel": "high"}'
```

### Test 6: Verify Alert Bypasses DND

1. Enable Do Not Disturb on companion device
2. Trigger crisis alert (Method A or B above)
3. Alert should still show and make sound
4. **iOS:** Must have Critical Alerts entitlement approved
5. **Android:** Should work immediately

## Troubleshooting

### Notification Service Not Starting

Check logs in DigitalOcean:
- App Platform → Your App → Runtime Logs
- Look for "Firebase Admin SDK initialized successfully"
- If error, check `FIREBASE_PRIVATE_KEY` format

### Database Connection Failed

- Verify `DATABASE_URL` is identical to main backend
- Check SSL mode: `?sslmode=require`
- Test connection: `psql $DATABASE_URL -c "SELECT 1;"`

### Companion App Not Receiving Alerts

1. **Check device token registered:**
   ```sql
   SELECT * FROM companion_devices WHERE phone_number = '+1234567890';
   ```

2. **Check Firebase Console:**
   - Go to Cloud Messaging
   - Look for delivery errors

3. **Verify phone number matches:**
   - Companion app phone must match FavPerson phone in vault

4. **iOS only:**
   - Check Critical Alerts entitlement status
   - Settings → Notifications → App → Critical Alerts (must be ON)

### Crisis Alert Not Triggering

1. **Check emergency contacts exist:**
   ```bash
   curl https://api.my-echoes.app/api/crisis/emergency-contacts \
     -H "Cookie: auth-session=..."
   ```

2. **Verify NOTIFICATION_SERVICE_URL is set in main backend**

3. **Check main backend logs:**
   ```bash
   grep "Crisis detected" logs
   ```

## Success Checklist

- [ ] Notification service deployed and healthy
- [ ] Database tables created
- [ ] Main backend environment variable set
- [ ] Companion app built and installed
- [ ] Device registered successfully
- [ ] Test alert received
- [ ] Emergency contact added to vault
- [ ] Crisis alert received on companion app
- [ ] Alert bypasses Do Not Disturb

## Next Steps

1. **Enable monitoring:**
   - Set up DigitalOcean monitoring alerts
   - Track notification delivery rates
   - Monitor database connection pool

2. **Add more emergency contacts:**
   - Have family/friends install companion app
   - Add them to Memory Vault with priority 1-3

3. **Test in production:**
   - Conduct user acceptance testing
   - Gather feedback from emergency contacts

4. **Document procedures:**
   - Create runbook for common issues
   - Train support team on crisis flow

## Support

If you encounter issues:

1. **Check full documentation:**
   - `/home/atharva/mental-health/CRISIS_NOTIFICATION_SYSTEM.md`

2. **Review component READMEs:**
   - Notification Service: `/home/atharva/mental-health/notification-service/README.md`
   - Companion App: `/home/atharva/mental-health/companion-app/README.md`

3. **Check system status:**
   - Main Backend: https://api.my-echoes.app/health
   - Notification Service: https://[your-url]/api/notifications/health

4. **Review logs:**
   - DigitalOcean → Your App → Runtime Logs
   - Look for errors in Firebase initialization or FCM delivery

## Estimated Costs

- Notification Service: $5/mo (Basic tier, covered by credits)
- Firebase: $0/mo (free tier supports 10M messages/month)
- Database: $0 additional (uses existing database)
- Companion App:
  - Android: $25 one-time (Google Play)
  - iOS: $99/year (Apple Developer)
  - TestFlight: Free

**Total monthly cost: $5** (or $0 with DigitalOcean credits)

## Security Reminders

- ✅ Never commit `.env` files
- ✅ Rotate Firebase keys periodically
- ✅ Use HTTPS for all endpoints
- ✅ Monitor for suspicious activity
- ✅ Implement rate limiting in production

---

**You're all set!** The crisis notification system is now operational and ready to help support mental health emergencies.
