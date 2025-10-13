# 🔍 NETWORK ERROR DEBUGGING

## The Error You're Seeing:
```
ERROR Signup failed: [Error: Network Error]
```

## 🧪 What to Check:

### **1. Look at Expo Logs in Terminal**

In your terminal where `npx expo start` is running, look for:
```
🌐 API Request: POST /api/auth/sign-up/email
❌ API Error: { ... detailed error ... }
```

This will tell us the REAL error.

### **2. Shake Your Phone**

1. **Shake your phone** while in Expo Go
2. **Tap "Show Performance Monitor"** or **"Show Element Inspector"**
3. Look for console logs with 🌐 and ❌ emojis

### **3. Check Your Phone's Console**

Run this in a NEW terminal:
```bash
# For Android
npx react-native log-android

# For iOS
npx react-native log-ios
```

This shows real-time logs from your phone.

---

## 🔧 **Possible Causes & Fixes:**

### **Cause 1: HTTPS Certificate Issue (Expo Go)**

Expo Go might not trust your HTTPS certificate.

**Test if HTTP works:**

Temporarily change `src/config/api.ts`:
```typescript
BASE_URL: 'http://api.my-echoes.app',  // Remove 's' from https
```

**Then test signup again.**

If this works → It's an HTTPS certificate issue.

---

### **Cause 2: Timeout (Slow Network)**

Mobile network is slower than WiFi.

**Already fixed:** Increased timeout to 60 seconds.

---

### **Cause 3: Backend Not Responding**

Test backend directly from terminal:
```bash
curl -X POST https://api.my-echoes.app/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123","name":"Test User"}'
```

Should return JSON (not Network Error).

---

### **Cause 4: CORS Blocking Mobile Requests**

We already updated CORS, but verify:

Check `src/server.ts` line 46 has:
```typescript
allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
exposedHeaders: ['Set-Cookie'],
```

---

### **Cause 5: Axios Config Issue**

The axios instance might need manual headers.

**Check what's in the logs** - it should show:
```
🌐 API Request: POST /api/auth/sign-up/email
```

If you DON'T see this → axios isn't even trying to make the request.

---

## ✅ **IMMEDIATE ACTION:**

### **Run This to See Detailed Logs:**

**Terminal 1:**
```bash
cd /home/atharva/mental-health
npm run dev
```

**Terminal 2:**
```bash
cd /home/atharva/mental-health/mobile
npx expo start --clear
```

**Terminal 3 (NEW):**
```bash
# For Android
npx react-native log-android
```

**Now try signup on your phone and watch all 3 terminals.**

---

## 📱 **WHAT TO LOOK FOR:**

**In Terminal 3 (phone logs):**
```
🌐 API Request: POST /api/auth/sign-up/email
❌ API Error: { code: 'ERR_NETWORK', message: '...' }
```

**Send me the output** and I'll fix it immediately!

---

## 🎯 **Quick Test:**

Try this simpler URL first to test if network works at all:

Change `BASE_URL` to:
```typescript
BASE_URL: 'https://jsonplaceholder.typicode.com',
```

Then try signup. If it still says "Network Error" → It's an Expo Go network issue, not your backend.

---

**Check the logs and tell me what you see!** 🔍
