# Crisis Notification System - Commands Reference

Quick reference for all commands needed to deploy, test, and maintain the system.

---

## Development Commands

### Notification Service

```bash
# Navigate to service
cd /home/atharva/mental-health/notification-service

# Install dependencies
npm install

# Development with hot reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Companion App

```bash
# Navigate to app
cd /home/atharva/mental-health/companion-app

# Install dependencies
npm install

# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Build for Android (EAS)
npm run build:android

# Build for iOS (EAS)
npm run build:ios
```

### Main Backend

```bash
# Navigate to main backend
cd /home/atharva/mental-health

# Install dependencies
npm install

# Development
npm run dev

# Production
npm start
```

---

## Database Commands

### Create Tables

```bash
# Run schema migration
psql "postgresql://doadmin:PASSWORD@HOST:PORT/defaultdb?sslmode=require" \
  -f /home/atharva/mental-health/notification-service/database/schema.sql
```

### Check Tables

```bash
# List tables
psql $DATABASE_URL -c "\dt"

# Check companion devices
psql $DATABASE_URL -c "SELECT COUNT(*) FROM companion_devices;"

# Check crisis notifications
psql $DATABASE_URL -c "SELECT COUNT(*) FROM crisis_notifications;"
```

### Query Companion Devices

```bash
# List all devices
psql $DATABASE_URL -c "SELECT phone_number, platform, person_name, last_active FROM companion_devices ORDER BY last_active DESC;"

# Find device by phone
psql $DATABASE_URL -c "SELECT * FROM companion_devices WHERE phone_number = '+1234567890';"

# Count active devices (active in last 7 days)
psql $DATABASE_URL -c "SELECT COUNT(*) FROM companion_devices WHERE last_active >= NOW() - INTERVAL '7 days';"
```

### Query Crisis Notifications

```bash
# Recent notifications (last 24 hours)
psql $DATABASE_URL -c "SELECT user_name, recipient_phone, crisis_level, status, sent_at FROM crisis_notifications WHERE sent_at >= NOW() - INTERVAL '24 hours' ORDER BY sent_at DESC;"

# Delivery success rate
psql $DATABASE_URL -c "SELECT crisis_level, COUNT(*) as total, SUM(CASE WHEN status = 'opened' THEN 1 ELSE 0 END) as opened, ROUND(100.0 * SUM(CASE WHEN status = 'opened' THEN 1 ELSE 0 END) / COUNT(*), 2) as open_rate FROM crisis_notifications GROUP BY crisis_level;"

# Failed notifications
psql $DATABASE_URL -c "SELECT * FROM crisis_notifications WHERE status = 'failed' ORDER BY sent_at DESC LIMIT 10;"
```

### Cleanup Commands

```bash
# Remove old notifications (older than 90 days)
psql $DATABASE_URL -c "DELETE FROM crisis_notifications WHERE sent_at < NOW() - INTERVAL '90 days';"

# Remove inactive devices (no activity in 90 days)
psql $DATABASE_URL -c "DELETE FROM companion_devices WHERE last_active < NOW() - INTERVAL '90 days';"
```

---

## API Testing Commands

### Health Checks

```bash
# Main backend health
curl https://api.my-echoes.app/health

# Notification service health
curl https://YOUR-NOTIFICATION-SERVICE.ondigitalocean.app/api/notifications/health
```

### Test Notification Service Connection

```bash
# From main backend (requires auth)
curl https://api.my-echoes.app/api/crisis/test-notification-service \
  -H "Cookie: auth-session=YOUR-SESSION-COOKIE"
```

### Register Companion Device

```bash
curl -X POST https://YOUR-NOTIFICATION-SERVICE.ondigitalocean.app/api/notifications/register-device \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "deviceToken": "test-token-123",
    "platform": "android",
    "personName": "Test User"
  }'
```

### Send Test Alert

```bash
curl -X POST https://YOUR-NOTIFICATION-SERVICE.ondigitalocean.app/api/notifications/test-alert \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890"
  }'
```

### Manual Crisis Trigger

```bash
curl -X POST https://api.my-echoes.app/api/crisis/trigger-alert \
  -H "Cookie: auth-session=YOUR-SESSION-COOKIE" \
  -H "Content-Type: application/json" \
  -d '{
    "crisisLevel": "high"
  }'
```

### Get Emergency Contacts

```bash
curl https://api.my-echoes.app/api/crisis/emergency-contacts \
  -H "Cookie: auth-session=YOUR-SESSION-COOKIE"
```

### Get Notification History

```bash
curl https://YOUR-NOTIFICATION-SERVICE.ondigitalocean.app/api/notifications/history/USER-ID
```

---

## Deployment Commands

### Git Commands

```bash
# Add new files
git add notification-service/
git add companion-app/
git add src/services/crisisAlertService.ts
git add src/routes/crisis.ts
git add *.md

# Commit
git commit -m "Add emergency crisis notification system"

# Push
git push origin main

# Tag release
git tag -a v1.0.0 -m "Initial release of crisis notification system"
git push origin v1.0.0
```

### Docker Commands (Notification Service)

```bash
# Build image
docker build -t mental-health-notifications:latest /home/atharva/mental-health/notification-service

# Run locally
docker run -p 3001:3001 --env-file .env mental-health-notifications:latest

# Push to registry
docker tag mental-health-notifications:latest registry.digitalocean.com/YOUR-REGISTRY/mental-health-notifications:latest
docker push registry.digitalocean.com/YOUR-REGISTRY/mental-health-notifications:latest
```

### EAS Build Commands (Companion App)

```bash
cd /home/atharva/mental-health/companion-app

# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for Android (preview/testing)
eas build --platform android --profile preview

# Build for Android (production)
eas build --platform android --profile production

# Build for iOS (development)
eas build --platform ios --profile development

# Build for iOS (production)
eas build --platform ios --profile production

# Submit to App Store
eas submit --platform ios

# Submit to Google Play
eas submit --platform android
```

---

## Monitoring Commands

### DigitalOcean CLI

```bash
# Install doctl
snap install doctl

# Authenticate
doctl auth init

# List apps
doctl apps list

# Get app info
doctl apps get APP-ID

# View logs
doctl apps logs APP-ID --type run

# View deployment
doctl apps deployments list APP-ID

# Restart app
doctl apps redeploy APP-ID
```

### Check Service Status

```bash
# Notification service
curl -I https://YOUR-NOTIFICATION-SERVICE.ondigitalocean.app/api/notifications/health

# Main backend
curl -I https://api.my-echoes.app/health

# Check response time
time curl https://YOUR-NOTIFICATION-SERVICE.ondigitalocean.app/api/notifications/health
```

### View Logs

```bash
# Notification service logs (DigitalOcean)
doctl apps logs YOUR-APP-ID --type run --follow

# Filter for errors
doctl apps logs YOUR-APP-ID --type run | grep ERROR

# Filter for crisis alerts
doctl apps logs YOUR-APP-ID --type run | grep "Crisis detected"
```

---

## Firebase Commands

### Firebase CLI Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# List projects
firebase projects:list

# Select project
firebase use YOUR-PROJECT-ID
```

### Firebase Cloud Messaging

```bash
# Send test notification
firebase messaging:send \
  --token="DEVICE-TOKEN" \
  --notification-title="Test Alert" \
  --notification-body="This is a test notification"
```

---

## Backup Commands

### Database Backup

```bash
# Backup entire database
pg_dump "postgresql://USER:PASS@HOST:PORT/DB?sslmode=require" > backup.sql

# Backup only crisis tables
pg_dump "postgresql://USER:PASS@HOST:PORT/DB?sslmode=require" \
  -t companion_devices \
  -t crisis_notifications > crisis_backup.sql

# Restore from backup
psql "postgresql://USER:PASS@HOST:PORT/DB?sslmode=require" < backup.sql
```

### Code Backup

```bash
# Create tarball of notification service
tar -czf notification-service-backup.tar.gz notification-service/

# Create tarball of companion app
tar -czf companion-app-backup.tar.gz companion-app/

# Extract backup
tar -xzf notification-service-backup.tar.gz
```

---

## Environment Setup Commands

### Notification Service Environment

```bash
# Copy example to .env
cp notification-service/.env.example notification-service/.env

# Edit environment variables
nano notification-service/.env

# Required variables:
# PORT=3001
# DATABASE_URL=postgresql://...
# FIREBASE_PROJECT_ID=...
# FIREBASE_CLIENT_EMAIL=...
# FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# MAIN_BACKEND_URL=https://api.my-echoes.app
```

### Main Backend Environment

```bash
# Add to existing .env
echo "NOTIFICATION_SERVICE_URL=https://YOUR-NOTIFICATION-SERVICE.ondigitalocean.app" >> .env
```

### Companion App Configuration

```bash
# Edit app.json
nano companion-app/app.json

# Update:
# "extra": {
#   "notificationServiceUrl": "https://YOUR-NOTIFICATION-SERVICE.ondigitalocean.app"
# }
```

---

## Troubleshooting Commands

### Check Port Availability

```bash
# Check if port 3001 is in use
lsof -i :3001

# Kill process on port 3001
kill -9 $(lsof -t -i:3001)
```

### Test Database Connection

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Test with SSL
psql "postgresql://USER:PASS@HOST:PORT/DB?sslmode=require" -c "SELECT version();"
```

### Validate Firebase Credentials

```bash
# Test Firebase Admin SDK
node -e "
const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
});
console.log('Firebase initialized successfully!');
"
```

### Check FCM Token Validity

```bash
# Send test message to token
curl -X POST https://fcm.googleapis.com/v1/projects/YOUR-PROJECT-ID/messages:send \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "token": "DEVICE-TOKEN",
      "notification": {
        "title": "Test",
        "body": "Test notification"
      }
    }
  }'
```

### Network Diagnostics

```bash
# Test DNS resolution
nslookup YOUR-NOTIFICATION-SERVICE.ondigitalocean.app

# Test connectivity
ping YOUR-NOTIFICATION-SERVICE.ondigitalocean.app

# Test SSL certificate
openssl s_client -connect YOUR-NOTIFICATION-SERVICE.ondigitalocean.app:443

# Trace route
traceroute YOUR-NOTIFICATION-SERVICE.ondigitalocean.app
```

---

## Performance Testing Commands

### Load Testing (Apache Bench)

```bash
# Install ab
sudo apt-get install apache2-utils

# Test health endpoint (100 requests, 10 concurrent)
ab -n 100 -c 10 https://YOUR-NOTIFICATION-SERVICE.ondigitalocean.app/api/notifications/health

# Test with POST request
ab -n 100 -c 10 -p test-payload.json -T application/json \
  https://YOUR-NOTIFICATION-SERVICE.ondigitalocean.app/api/notifications/register-device
```

### Database Performance

```bash
# Analyze table statistics
psql $DATABASE_URL -c "ANALYZE companion_devices; ANALYZE crisis_notifications;"

# Check table sizes
psql $DATABASE_URL -c "SELECT relname, pg_size_pretty(pg_total_relation_size(relid)) FROM pg_catalog.pg_statio_user_tables ORDER BY pg_total_relation_size(relid) DESC;"

# Check index usage
psql $DATABASE_URL -c "SELECT schemaname, tablename, indexname, idx_scan FROM pg_stat_user_indexes ORDER BY idx_scan DESC;"
```

---

## Maintenance Commands

### Update Dependencies

```bash
# Notification service
cd notification-service
npm outdated
npm update
npm audit fix

# Companion app
cd companion-app
npm outdated
npm update
npm audit fix

# Main backend
cd /home/atharva/mental-health
npm outdated
npm update
npm audit fix
```

### Security Audit

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Force fix (may break compatibility)
npm audit fix --force
```

### Rotate Firebase Keys

```bash
# 1. Generate new service account in Firebase Console
# 2. Download new JSON file
# 3. Update environment variables
# 4. Redeploy notification service
# 5. Verify new credentials work
# 6. Delete old service account in Firebase Console
```

---

## Quick Reference

### Most Used Commands

```bash
# Check health
curl https://YOUR-NOTIFICATION-SERVICE.ondigitalocean.app/api/notifications/health

# View recent notifications
psql $DATABASE_URL -c "SELECT * FROM crisis_notifications ORDER BY sent_at DESC LIMIT 10;"

# Count active devices
psql $DATABASE_URL -c "SELECT COUNT(*) FROM companion_devices WHERE last_active >= NOW() - INTERVAL '7 days';"

# Trigger test crisis alert
curl -X POST https://api.my-echoes.app/api/crisis/trigger-alert \
  -H "Cookie: auth-session=COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"crisisLevel": "high"}'

# View logs
doctl apps logs APP-ID --type run --follow
```

### Emergency Commands

```bash
# Restart notification service
doctl apps redeploy APP-ID

# Check database connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity WHERE datname='defaultdb';"

# Kill all idle connections
psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND datname='defaultdb';"

# Clear invalid device tokens
psql $DATABASE_URL -c "DELETE FROM companion_devices WHERE last_active < NOW() - INTERVAL '30 days';"
```

---

## Useful Aliases

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# Navigation
alias cdnotif='cd /home/atharva/mental-health/notification-service'
alias cdcomp='cd /home/atharva/mental-health/companion-app'
alias cdmh='cd /home/atharva/mental-health'

# Database
alias mhdb='psql $DATABASE_URL'
alias mhdevices='psql $DATABASE_URL -c "SELECT * FROM companion_devices ORDER BY last_active DESC;"'
alias mhnotifs='psql $DATABASE_URL -c "SELECT * FROM crisis_notifications ORDER BY sent_at DESC LIMIT 20;"'

# Services
alias notifhealth='curl https://YOUR-NOTIFICATION-SERVICE.ondigitalocean.app/api/notifications/health'
alias mainhealth='curl https://api.my-echoes.app/health'

# Logs
alias notiflogs='doctl apps logs YOUR-APP-ID --type run --follow'
```

---

**Last Updated:** October 14, 2025
**Version:** 1.0.0

For more information, see:
- **Full Documentation:** CRISIS_NOTIFICATION_SYSTEM.md
- **Quick Start:** QUICKSTART.md
- **Project Structure:** PROJECT_STRUCTURE.md
