# Mental Health Journal - Mobile App (React Native + Expo)

AI-based journaling mobile app matching the Next.js frontend design system.

## 🚀 Setup Instructions

### 1. Update API Configuration

**Open** `src/config/api.ts` and update the BASE_URL:

```typescript
export const API_CONFIG = {
  BASE_URL: __DEV__
    ? 'http://YOUR_LOCAL_IP:8080'  // ← Change this to your machine's local IP
    : 'https://api.my-echoes.app',  // ← Or your DigitalOcean URL
};
```

**To find your local IP:**
- **Mac/Linux:** Run `ifconfig | grep "inet " | grep -v 127.0.0.1`
- **Windows:** Run `ipconfig` and look for IPv4 Address

**Example:** `http://192.168.1.100:8080`

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the App

#### Android:
```bash
npm run android
```

#### iOS (Mac only):
```bash
npm run ios
```

#### Web (for testing):
```bash
npm run web
```

## 📱 Features Implemented

### ✅ **Journaling**
- Create new journal entries with title & content
- Mental health tracking (mood, energy, anxiety, stress - all 1-10 scale)
- AI analysis with supportive messages
- Privacy settings (server-managed vs zero-knowledge encryption)
- Journal history/list view
- Pull-to-refresh

### ✅ **UI/UX**
- Matches frontend design system exactly
- Primary color: `#6B5FA8` (purple)
- Georgia serif font for journal content
- Soft gradients and backdrop blur effects
- Smooth animations and loading states

### ⚠️ **Authentication (NOT IMPLEMENTED YET)**

Authentication screens need to be added. Here's what's needed:

1. **Login Screen**
2. **Sign Up Screen**
3. **Auth Context** to manage user state
4. **Protected Routes** to check if user is authenticated
5. **Token Storage** using AsyncStorage

## 🔧 Configuration

### Backend API Endpoints

Current endpoints configured (see `src/config/api.ts`):

- `POST /api/journal` - Create journal entry
- `GET /api/journal` - Get all entries
- `GET /api/journal/:id` - Get single entry
- `PUT /api/journal/:id` - Update entry
- `DELETE /api/journal/:id` - Delete entry

### Environment Setup

For production, update:
- `API_CONFIG.BASE_URL` to your DigitalOcean API URL
- Authentication token handling in `src/services/api.ts`

## 📁 Project Structure

```
mobile/
├── src/
│   ├── config/
│   │   ├── theme.ts          # Design system (colors, fonts, spacing)
│   │   └── api.ts            # API configuration
│   ├── components/
│   │   ├── Button.tsx        # Custom button component
│   │   ├── Input.tsx         # Custom input component
│   │   └── Slider.tsx        # Mood tracking slider
│   ├── screens/
│   │   ├── NewJournalScreen.tsx  # Create new journal entry
│   │   └── JournalListScreen.tsx # View all entries
│   ├── services/
│   │   └── api.ts            # API service (axios client)
│   ├── types/
│   │   └── journal.ts        # TypeScript interfaces
│   └── navigation/
│       └── AppNavigator.tsx  # Navigation setup
└── App.tsx                   # Root component
```

## 🎨 Design System

Matches the frontend exactly:

- **Primary Purple:** `#6B5FA8`
- **Secondary Purple:** `#5A4F96`
- **Light Purple:** `#8B86B8`
- **Background:** Soft purple gradients
- **Font:** Georgia serif for journal content
- **Border Radius:** Rounded (`2xl`, `3xl`)
- **Shadows:** Purple-tinted soft shadows

## 🔐 Next Steps: Adding Authentication

To complete the app, you need to add:

### 1. Auth Context (`src/context/AuthContext.tsx`)
```typescript
- Store user data (id, name, email, token)
- Login/logout methods
- Token refresh logic
```

### 2. Login Screen (`src/screens/LoginScreen.tsx`)
```typescript
- Email + password fields
- Call POST /api/auth/sign-in/email
- Store token in AsyncStorage
- Navigate to JournalList on success
```

### 3. Sign Up Screen (`src/screens/SignUpScreen.tsx`)
```typescript
- Name, email, password fields
- Call POST /api/auth/sign-up/email
- Auto-login after signup
```

### 4. Protected Routes
```typescript
- Check if user is authenticated before showing journal screens
- Redirect to Login if not authenticated
```

### 5. Update API Service
```typescript
- Add auth token to all requests (already set up in interceptor)
- Handle 401 errors (logout user)
```

## 🐛 Troubleshooting

### "Network Error"
- Make sure your backend is running: `http://YOUR_IP:8080`
- Update `BASE_URL` in `src/config/api.ts`
- Check your phone and computer are on the same WiFi network

### Slider Not Working
- Make sure you installed: `@react-native-community/slider`
- Restart Metro bundler: `npm start -- --reset-cache`

### Navigation Issues
- Make sure all dependencies are installed
- For iOS: `cd ios && pod install && cd ..`

## 📚 Tech Stack

- **React Native** - Mobile framework
- **Expo** - Development platform
- **TypeScript** - Type safety
- **React Navigation** - Navigation
- **Axios** - HTTP client
- **React Native Gesture Handler** - Touch gestures
- **Expo Linear Gradient** - Gradient backgrounds

## 🚢 Deployment

To build production APK/IPA:

```bash
# Android APK
eas build --platform android

# iOS (requires Apple Developer account)
eas build --platform ios
```

## 📝 License

MIT

---

**Built with ❤️ to match the frontend design system exactly**
