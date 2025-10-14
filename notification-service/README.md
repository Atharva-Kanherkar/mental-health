# Mental Health Notification Service

Emergency notification microservice for mental health crisis alerts using Firebase Cloud Messaging (FCM).

## Architecture

```
Main Backend (crisis detected)
    ↓ HTTP POST
Notification Microservice (this service)
    ↓ Firebase Cloud Messaging
Companion App (emergency contact's phone)
    ↓ Critical Alert (bypasses Do Not Disturb)
Emergency Contact
```

## Features

- **Critical Alerts**: Bypasses Do Not Disturb mode on iOS and Android
- **Priority-Based Delivery**: Sends to emergency contacts based on priority (1-10)
- **Device Management**: Registers and manages companion app device tokens
- **Delivery Tracking**: Logs sent, delivered, and opened status
- **Multi-Platform**: Supports both iOS (APNS) and Android (FCM)
- **Automatic Cleanup**: Removes invalid device tokens

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
PORT=3001
DATABASE_URL=postgresql://user:password@host:port/database
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
MAIN_BACKEND_URL=https://api.my-echoes.app
```

### 3. Set Up Database

Run the schema creation script:

```bash
psql $DATABASE_URL < database/schema.sql
```

This creates two tables:
- `companion_devices` - Stores device tokens for emergency contacts
- `crisis_notifications` - Logs all crisis notifications

### 4. Configure Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing
3. Go to Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Copy the values to your `.env` file

## Running the Service

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## API Endpoints

### POST /api/notifications/send-crisis-alert

Send crisis alerts to emergency contacts. Called by main backend.

**Request Body:**
```json
{
  "userId": "uuid",
  "userName": "John Doe",
  "crisisLevel": "high",
  "emergencyContacts": [
    {
      "phoneNumber": "+1234567890",
      "name": "Mom",
      "priority": 1
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "totalContacts": 3,
  "devicesFound": 2,
  "notificationsSent": 2,
  "deliveryStatuses": [...]
}
```

### POST /api/notifications/register-device

Register a companion app device. Called by companion app.

**Request Body:**
```json
{
  "phoneNumber": "+1234567890",
  "deviceToken": "fcm-token-here",
  "platform": "ios",
  "personName": "Mom"
}
```

### POST /api/notifications/ack

Acknowledge that a notification was opened.

**Request Body:**
```json
{
  "notificationId": "uuid",
  "deviceToken": "fcm-token-here"
}
```

### POST /api/notifications/test-alert

Send a test notification to verify setup.

**Request Body:**
```json
{
  "phoneNumber": "+1234567890"
}
```

### GET /api/notifications/history/:userId

Get notification history for a user.

### GET /api/notifications/health

Health check endpoint.

## Deployment

### DigitalOcean App Platform

1. Create new app from GitHub repo
2. Set environment variables in dashboard
3. Configure build settings:
   - Build Command: `npm run build`
   - Run Command: `npm start`
   - HTTP Port: `3001`
4. Deploy

The service will be available at: `https://your-app.ondigitalocean.app`

### Docker (Alternative)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## Integration with Main Backend

In your main backend, add this code to trigger crisis alerts:

```typescript
async function triggerCrisisAlert(userId: string, crisisLevel: string) {
  const response = await fetch(`${NOTIFICATION_SERVICE_URL}/api/notifications/send-crisis-alert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      userName: user.name,
      crisisLevel,
      emergencyContacts: contacts.map(c => ({
        phoneNumber: c.phoneNumber,
        name: c.name,
        priority: c.priority
      }))
    })
  });

  return await response.json();
}
```

Call this function after detecting crisis in daily check-in:

```typescript
const isHighRisk = checkIn.hadSuicidalThoughts || checkIn.actedOnHarm ||
                  (checkIn.hadSelfHarmThoughts && checkIn.overallMood <= 3);

if (isHighRisk) {
  await triggerCrisisAlert(userId, 'high');
}
```

## Security Considerations

1. **API Authentication**: Add API key authentication for production
2. **HTTPS Only**: Always use HTTPS in production
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Input Validation**: All inputs are validated with Joi
5. **Database Security**: Use connection pooling with SSL

## Monitoring

Key metrics to monitor:

- Notification delivery success rate
- FCM token invalidation rate
- Average notification delivery time
- Database connection pool usage
- API endpoint response times

## Troubleshooting

### Notifications not sending

1. Check Firebase credentials in `.env`
2. Verify device token is valid
3. Check Firebase Console → Cloud Messaging for errors
4. Ensure app has notification permissions

### Invalid device token errors

- Device tokens expire when app is uninstalled
- Service automatically removes invalid tokens
- Users need to re-register device

### Database connection issues

- Verify `DATABASE_URL` is correct
- Check SSL settings for production
- Ensure database allows connections from service IP

## License

MIT
