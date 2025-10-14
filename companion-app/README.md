# Mental Health Companion App

Emergency alert companion app for receiving critical mental health crisis notifications.

## Features

- **Critical Alerts**: Bypasses Do Not Disturb mode on both iOS and Android
- **Minimal Setup**: Just enter phone number and name to start
- **Instant Communication**: Quick call/text buttons to reach person in crisis
- **No Authentication**: No login required, works immediately
- **Low Battery Usage**: Optimized for minimal power consumption (<1%/day)
- **Always Active**: Persistent service ensures you never miss an alert

## Architecture

```
Main App (crisis detected)
    ↓ HTTP POST
Notification Service
    ↓ Firebase Cloud Messaging
Companion App (this app)
    ↓ Critical Alert
Emergency Contact's Phone
```

## Setup

### Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator or Android Emulator (for development)
- Physical device (for production testing)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

### Configuration

Update `app.json` with your notification service URL:

```json
{
  "expo": {
    "extra": {
      "notificationServiceUrl": "https://your-notification-service.ondigitalocean.app"
    }
  }
}
```

## Firebase Cloud Messaging Setup

### iOS

1. Create iOS app in Firebase Console
2. Download `GoogleService-Info.plist`
3. Add to project root
4. Enable Push Notifications capability in Xcode
5. Request Critical Alerts entitlement from Apple:
   - Go to https://developer.apple.com/contact/request/notifications-critical-alerts-entitlement/
   - Fill out the form explaining mental health crisis use case
   - Wait for approval (usually 1-3 business days)

### Android

1. Create Android app in Firebase Console
2. Download `google-services.json`
3. Place in project root
4. Build and test

## App Screens

### 1. Link Screen

- Enter phone number
- Enter name (e.g., "Mom", "Dad", "Sarah")
- Request notification permissions
- Register with notification service
- Navigate to Active screen on success

### 2. Active Screen

- Shows active protection status
- Displays linked phone number and name
- "Send Test Alert" button for testing
- "Unlink Device" to disconnect
- Last checked timestamp
- Listens for crisis alerts in background

### 3. Alert Screen (Crisis Alert)

- Full-screen modal with gradient background
- Crisis level badge (Moderate/High/Critical)
- Alert timestamp
- Quick action buttons:
  - **Call** - Opens phone dialer
  - **Text** - Opens SMS app
  - **I've Contacted Them** - Acknowledges alert
- Emergency services button
- Auto-vibration pattern
- Dismisses after acknowledgment

## Critical Alert Configuration

### iOS (app.json)

```json
{
  "ios": {
    "infoPlist": {
      "UIBackgroundModes": ["remote-notification"],
      "UNUserNotificationCenter": {
        "UNAuthorizationOptionCriticalAlert": true
      }
    }
  }
}
```

### Android (app.json)

```json
{
  "android": {
    "permissions": [
      "POST_NOTIFICATIONS",
      "VIBRATE",
      "USE_FULL_SCREEN_INTENT",
      "WAKE_LOCK"
    ],
    "useNextNotificationsApi": true
  }
}
```

## Building for Production

### Using EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

### Android APK

```bash
# Build APK for distribution
eas build --platform android --profile preview
```

### iOS IPA

```bash
# Build for TestFlight
eas build --platform ios --profile production
```

## Distribution

### Google Play Store

1. Create developer account ($25 one-time fee)
2. Create new app listing
3. Upload APK from EAS build
4. Fill out store listing:
   - Title: "Mental Health Companion"
   - Description: Emergency alert app for mental health support
   - Category: Medical
   - Target audience: Adults 18+
5. Submit for review

### Apple App Store

1. Create Apple Developer account ($99/year)
2. Create app in App Store Connect
3. Upload IPA from EAS build
4. Fill out app information:
   - Name: "Mental Health Companion"
   - Description: Critical alert app for emergency support
   - Category: Medical
   - Age rating: 17+
5. Request Critical Alerts entitlement
6. Submit for review

### TestFlight (Beta Testing)

```bash
# Build and submit to TestFlight
eas build --platform ios --auto-submit
```

Share TestFlight link with beta testers.

## Testing

### Test Notifications

1. Link device with phone number
2. Tap "Send Test Alert" button
3. Should receive test notification within seconds
4. Verify notification bypasses DND (enable DND mode first)

### Test Crisis Alert

From notification service backend:

```bash
curl -X POST https://your-service.ondigitalocean.app/api/notifications/send-crisis-alert \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-id",
    "userName": "Test User",
    "crisisLevel": "high",
    "emergencyContacts": [
      {
        "phoneNumber": "+1234567890",
        "name": "Test Contact",
        "priority": 1
      }
    ]
  }'
```

## Privacy & Security

- **No Personal Data Storage**: Only phone number stored locally
- **No Tracking**: No analytics or tracking SDKs
- **Minimal Permissions**: Only notification and phone permissions required
- **No Cloud Backup**: AsyncStorage excluded from cloud backups
- **No Account Required**: No user accounts or authentication

## Troubleshooting

### Notifications not received

1. Check notification permissions in device settings
2. Verify phone number matches FavPerson in main app
3. Ensure notification service is running
4. Check Firebase Console for errors
5. Verify device token was registered successfully

### Critical alerts not bypassing DND

**iOS:**
- Ensure Critical Alerts entitlement is approved
- Check notification settings: Settings → Notifications → App → Critical Alerts
- Must be enabled in app notification settings

**Android:**
- Verify `USE_FULL_SCREEN_INTENT` permission granted
- Check notification channel settings
- Some manufacturers (e.g., Xiaomi) require additional battery optimization exceptions

### App not receiving alerts when closed

**iOS:**
- Background app refresh must be enabled
- Check Settings → General → Background App Refresh

**Android:**
- Disable battery optimization for app
- Settings → Apps → App → Battery → Unrestricted

## Support

For issues, please contact:
- Email: support@my-echoes.app
- GitHub: [Project Repository]

## License

MIT
